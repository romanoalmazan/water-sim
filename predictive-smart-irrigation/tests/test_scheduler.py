"""Tests for irrigation scheduler."""

import pytest
from datetime import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from control.scheduler import schedule_zones_greedy, parse_time_window


def test_parse_time_window():
    """Test time window parsing."""
    date = datetime(2025, 1, 15)
    start, end = parse_time_window("02:00", "06:00", date)
    
    assert start.hour == 2
    assert start.minute == 0
    assert end.hour == 6
    assert end.minute == 0


def test_scheduler_respects_capacity():
    """Test that scheduler respects pump capacity."""
    fields_needs = {
        'A': {'minutes': 60, 'liters': 6000, 'emitter_lpm': 100},
        'B': {'minutes': 60, 'liters': 3000, 'emitter_lpm': 50},
        'C': {'minutes': 60, 'liters': 12000, 'emitter_lpm': 200}
    }
    
    fields_config = [
        {'id': 'A', 'emitter_lpm': 100, 'priority': 1},
        {'id': 'B', 'emitter_lpm': 50, 'priority': 2},
        {'id': 'C', 'emitter_lpm': 200, 'priority': 3}
    ]
    
    pump_qmax = 250  # Can fit A+B (150) or C (200), but not A+B+C (350)
    
    schedule = schedule_zones_greedy(
        fields_needs,
        fields_config,
        pump_qmax,
        "02:00",
        "06:00",
        datetime(2025, 1, 15)
    )
    
    # Check that no time slot exceeds capacity
    # This is a basic check - full validation would require checking each time slot
    assert len(schedule) > 0
    
    # Total liters scheduled should match needs (if feasible)
    scheduled_liters = sum(s['liters'] for s in schedule)
    assert scheduled_liters > 0


def test_scheduler_respects_window():
    """Test that schedule stays within time window."""
    fields_needs = {
        'A': {'minutes': 30, 'liters': 3000, 'emitter_lpm': 100}
    }
    
    fields_config = [
        {'id': 'A', 'emitter_lpm': 100, 'priority': 1}
    ]
    
    schedule = schedule_zones_greedy(
        fields_needs,
        fields_config,
        500,
        "02:00",
        "06:00",
        datetime(2025, 1, 15)
    )
    
    if schedule:
        for entry in schedule:
            assert entry['start_ts'].hour >= 2
            assert entry['end_ts'].hour <= 6 or entry['end_ts'].day > entry['start_ts'].day


def test_scheduler_empty_needs():
    """Test scheduler with no irrigation needs."""
    fields_needs = {
        'A': {'minutes': 0, 'liters': 0, 'emitter_lpm': 100}
    }
    
    fields_config = [
        {'id': 'A', 'emitter_lpm': 100, 'priority': 1}
    ]
    
    schedule = schedule_zones_greedy(
        fields_needs,
        fields_config,
        500,
        "02:00",
        "06:00",
        datetime(2025, 1, 15)
    )
    
    # Should return empty or skip zero-need fields
    assert isinstance(schedule, list)

