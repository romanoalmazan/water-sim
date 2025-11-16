"""Irrigation scheduling with pump capacity and time window constraints."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd

# Try OR-Tools, fallback to greedy
try:
    from ortools.sat.python import cp_model
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False
    print("OR-Tools not available, using greedy scheduler")


def parse_time_window(window_start: str, window_end: str, date: datetime) -> tuple[datetime, datetime]:
    """Parse time window strings into datetime objects."""
    start_hour, start_min = map(int, window_start.split(':'))
    end_hour, end_min = map(int, window_end.split(':'))
    
    start_dt = date.replace(hour=start_hour, minute=start_min, second=0, microsecond=0)
    end_dt = date.replace(hour=end_hour, minute=end_min, second=0, microsecond=0)
    
    # Handle overnight windows
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)
    
    return start_dt, end_dt


def schedule_zones_greedy(
    fields_needs: Dict[str, Dict],
    fields_config: List[Dict],
    pump_qmax_lpm: float,
    window_start: str,
    window_end: str,
    date: datetime,
    time_slot_minutes: int = 5
) -> List[Dict]:
    """
    Greedy scheduler: pack fields into window respecting pump capacity.
    
    Args:
        fields_needs: Dict mapping field_id -> {minutes, liters, ...}
        fields_config: List of field configs (for priority, emitter_lpm)
        pump_qmax_lpm: Maximum pump capacity (L/min)
        window_start: Window start time (HH:MM)
        window_end: Window end time (HH:MM)
        date: Date for scheduling
        time_slot_minutes: Time slot granularity (minutes)
        
    Returns:
        List of schedule entries: {field_id, start_ts, end_ts, minutes, liters}
    """
    start_dt, end_dt = parse_time_window(window_start, window_end, date)
    window_minutes = int((end_dt - start_dt).total_seconds() / 60)
    
    # Create field list with priority and need
    field_list = []
    for field in fields_config:
        field_id = field['id']
        if field_id not in fields_needs:
            continue
        
        need_data = fields_needs[field_id]
        minutes = need_data.get('minutes', 0.0)
        if minutes <= 0:
            continue
        
        priority = field.get('priority', 5)
        emitter_lpm = field['emitter_lpm']
        
        field_list.append({
            'field_id': field_id,
            'minutes': minutes,
            'liters': need_data.get('liters', 0.0),
            'emitter_lpm': emitter_lpm,
            'priority': priority,
            'deficit': need_data.get('soil_deficit_mm', 0.0)
        })
    
    # Sort by priority (lower = higher priority), then by deficit (higher = more urgent)
    field_list.sort(key=lambda x: (x['priority'], -x['deficit']))
    
    # Greedy packing
    schedule = []
    current_time = start_dt
    active_fields = {}  # field_id -> {start_time, emitter_lpm}
    
    # Convert to time slots
    num_slots = window_minutes // time_slot_minutes
    
    for slot in range(num_slots):
        slot_start = start_dt + timedelta(minutes=slot * time_slot_minutes)
        slot_end = slot_start + timedelta(minutes=time_slot_minutes)
        
        # Calculate current pump load
        current_load_lpm = sum(f['emitter_lpm'] for f in active_fields.values())
        
        # Try to add new fields
        for field in field_list:
            field_id = field['field_id']
            if field_id in active_fields:
                continue
            
            # Check if adding this field exceeds capacity
            if current_load_lpm + field['emitter_lpm'] <= pump_qmax_lpm:
                active_fields[field_id] = {
                    'start_time': slot_start,
                    'emitter_lpm': field['emitter_lpm'],
                    'remaining_minutes': field['minutes']
                }
                current_load_lpm += field['emitter_lpm']
        
        # Update remaining time for active fields
        fields_to_remove = []
        for field_id, field_data in active_fields.items():
            field_data['remaining_minutes'] -= time_slot_minutes
            if field_data['remaining_minutes'] <= 0:
                # Field is done
                start_time = field_data['start_time']
                field_info = next(f for f in field_list if f['field_id'] == field_id)
                total_minutes = field_info['minutes']
                emitter_lpm = field_data['emitter_lpm']
                
                schedule.append({
                    'field_id': field_id,
                    'start_ts': start_time,
                    'end_ts': slot_end,
                    'minutes': total_minutes,
                    'liters': total_minutes * emitter_lpm
                })
                fields_to_remove.append(field_id)
        
        for field_id in fields_to_remove:
            del active_fields[field_id]
    
    # Handle fields that didn't finish
    for field_id, field_data in active_fields.items():
        field = next(f for f in field_list if f['field_id'] == field_id)
        schedule.append({
            'field_id': field_id,
            'start_ts': field_data['start_time'],
            'end_ts': end_dt,
            'minutes': field['minutes'],
            'liters': field['liters']
        })
    
    return schedule


def schedule_zones_ortools(
    fields_needs: Dict[str, Dict],
    fields_config: List[Dict],
    pump_qmax_lpm: float,
    window_start: str,
    window_end: str,
    date: datetime,
    time_slot_minutes: int = 5
) -> List[Dict]:
    """
    OR-Tools CP-SAT scheduler for optimal scheduling.
    
    Args:
        Same as schedule_zones_greedy
        
    Returns:
        List of schedule entries
    """
    if not HAS_ORTOOLS:
        return schedule_zones_greedy(
            fields_needs, fields_config, pump_qmax_lpm,
            window_start, window_end, date, time_slot_minutes
        )
    
    start_dt, end_dt = parse_time_window(window_start, window_end, date)
    window_minutes = int((end_dt - start_dt).total_seconds() / 60)
    num_slots = window_minutes // time_slot_minutes
    
    # Prepare field data
    field_list = []
    field_idx_map = {}
    for idx, field in enumerate(fields_config):
        field_id = field['id']
        if field_id not in fields_needs:
            continue
        
        need_data = fields_needs[field_id]
        minutes = need_data.get('minutes', 0.0)
        if minutes <= 0:
            continue
        
        emitter_lpm = field['emitter_lpm']
        required_slots = max(1, int(minutes / time_slot_minutes))
        
        field_list.append({
            'field_id': field_id,
            'required_slots': required_slots,
            'emitter_lpm': emitter_lpm,
            'minutes': minutes,
            'liters': need_data.get('liters', 0.0)
        })
        field_idx_map[field_id] = idx
    
    if not field_list:
        return []
    
    # Create model
    model = cp_model.CpModel()
    
    num_fields = len(field_list)
    
    # Decision variables: x[field][slot] = 1 if field irrigates in slot
    x = {}
    for i in range(num_fields):
        for s in range(num_slots):
            x[i, s] = model.NewBoolVar(f'field_{i}_slot_{s}')
    
    # Constraints: each field must run for required_slots consecutive slots
    for i, field_data in enumerate(field_list):
        required = field_data['required_slots']
        
        # At least one start position
        starts = []
        for start_slot in range(num_slots - required + 1):
            # If field starts at start_slot, it must be active for required slots
            start_var = model.NewBoolVar(f'field_{i}_starts_{start_slot}')
            starts.append(start_var)
            
            for offset in range(required):
                if start_slot + offset < num_slots:
                    model.Add(x[i, start_slot + offset] >= start_var).OnlyEnforceIf(start_var)
        
        # Exactly one start
        model.Add(sum(starts) == 1)
        
        # Field must be active for exactly required_slots
        model.Add(sum(x[i, s] for s in range(num_slots)) == required)
    
    # Pump capacity constraint: sum of active emitters <= Qmax
    for s in range(num_slots):
        total_load = sum(
            field_list[i]['emitter_lpm'] * x[i, s]
            for i in range(num_fields)
        )
        model.Add(total_load <= pump_qmax_lpm)
    
    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)
    
    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        schedule = []
        for i, field_data in enumerate(field_list):
            field_id = field_data['field_id']
            active_slots = [s for s in range(num_slots) if solver.Value(x[i, s])]
            
            if active_slots:
                start_slot = min(active_slots)
                end_slot = max(active_slots) + 1
                
                start_ts = start_dt + timedelta(minutes=start_slot * time_slot_minutes)
                end_ts = start_dt + timedelta(minutes=end_slot * time_slot_minutes)
                
                schedule.append({
                    'field_id': field_id,
                    'start_ts': start_ts,
                    'end_ts': end_ts,
                    'minutes': field_data['minutes'],
                    'liters': field_data['liters']
                })
        
        return schedule
    else:
        # Fallback to greedy
        return schedule_zones_greedy(
            fields_needs, fields_config, pump_qmax_lpm,
            window_start, window_end, date, time_slot_minutes
        )

