"""CLI tool to generate irrigation plan for a date."""

import argparse
import sys
from pathlib import Path
from datetime import datetime
import pandas as pd
import yaml

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.forecaster import FarmForecaster
from control.need_calc import calculate_all_fields_needs
from control.rules import baseline_controller, rule_based_controller
from control.scheduler import schedule_zones_greedy, schedule_zones_ortools


def load_config(config_path: Path) -> dict:
    """Load farm configuration."""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def generate_plan(
    date_str: str,
    use_api: bool = False,
    solver: str = "greedy",
    controller: str = "ml_optimizer"
):
    """Generate irrigation plan for a date."""
    project_root = Path(__file__).parent.parent
    config_path = project_root / 'config' / 'farm.yaml'
    data_dir = project_root / 'data'
    
    # Load config
    config = load_config(config_path)
    fields = config['fields']
    pump_qmax = config['pump']['qmax_lpm']
    window_start = config['window']['start']
    window_end = config['window']['end']
    
    # Load soils and crops
    soils_df = pd.read_csv(data_dir / 'soils.csv')
    crops_df = pd.read_csv(data_dir / 'crops.csv')
    
    # Parse date
    date = datetime.strptime(date_str, '%Y-%m-%d')
    
    # Get field IDs
    field_ids = [f['id'] for f in fields]
    
    # Forecast
    print(f"Forecasting for {date_str}...")
    forecaster = FarmForecaster()
    forecast_result = forecaster.predict(date, field_ids, source="api" if use_api else "offline")
    
    # Prepare forecast dict for need calculation
    forecast_dict = {
        'date': date,
        'rain_p10': forecast_result.get('rain', 0.0) * 0.7,
        'rain_p50': forecast_result.get('rain', 0.0),
        'rain_p90': forecast_result.get('rain', 0.0) * 1.3,
        'et0_p50': forecast_result.get('et0', 5.0),
        'et0_p90': forecast_result.get('et0', 5.0) * 1.2
    }
    
    # Calculate needs based on controller
    if controller == "baseline":
        fields_needs = baseline_controller(fields)
    elif controller == "rule_based":
        # Calculate needs first
        fields_needs_raw = calculate_all_fields_needs(
            fields, soils_df, crops_df, forecast_dict
        )
        fields_needs = rule_based_controller(fields_needs_raw, forecast_dict)
    else:  # ml_optimizer
        # Use ML predictions as base, then calculate needs
        fields_needs_raw = calculate_all_fields_needs(
            fields, soils_df, crops_df, forecast_dict
        )
        # Override with ML predictions if available
        for field_id, ml_liters in forecast_result.get('p50', {}).items():
            if field_id in fields_needs_raw:
                field = next(f for f in fields if f['id'] == field_id)
                from sim.agronomy import liters_to_minutes
                minutes = liters_to_minutes(ml_liters, field['emitter_lpm'])
                fields_needs_raw[field_id]['liters'] = ml_liters
                fields_needs_raw[field_id]['minutes'] = minutes
        
        fields_needs = rule_based_controller(fields_needs_raw, forecast_dict)
    
    # Schedule
    print(f"Scheduling with {solver} solver...")
    if solver == "ortools":
        schedule = schedule_zones_ortools(
            fields_needs, fields, pump_qmax,
            window_start, window_end, date
        )
    else:
        schedule = schedule_zones_greedy(
            fields_needs, fields, pump_qmax,
            window_start, window_end, date
        )
    
    # Save schedule
    outputs_dir = project_root / 'outputs'
    outputs_dir.mkdir(exist_ok=True)
    
    schedule_df = pd.DataFrame(schedule)
    if not schedule_df.empty:
        schedule_df['start_ts'] = pd.to_datetime(schedule_df['start_ts'])
        schedule_df['end_ts'] = pd.to_datetime(schedule_df['end_ts'])
        schedule_df['start_time'] = schedule_df['start_ts'].dt.strftime('%H:%M')
        schedule_df['end_time'] = schedule_df['end_ts'].dt.strftime('%H:%M')
    
    csv_path = outputs_dir / f'schedule_{date.strftime("%Y%m%d")}.csv'
    schedule_df.to_csv(csv_path, index=False)
    print(f"Schedule saved to {csv_path}")
    
    # Print summary
    total_liters = schedule_df['liters'].sum() if not schedule_df.empty else 0.0
    total_minutes = schedule_df['minutes'].sum() if not schedule_df.empty else 0.0
    print(f"\nSummary:")
    print(f"  Total water: {total_liters:.1f} L")
    print(f"  Total runtime: {total_minutes:.1f} minutes")
    print(f"  Fields scheduled: {len(schedule_df)}")
    
    return schedule_df


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate irrigation plan')
    parser.add_argument('--date', type=str, required=True, help='Date (YYYY-MM-DD)')
    parser.add_argument('--use_api', type=bool, default=False, help='Use weather API')
    parser.add_argument('--solver', type=str, default='greedy', choices=['greedy', 'ortools'])
    parser.add_argument('--controller', type=str, default='ml_optimizer',
                       choices=['baseline', 'rule_based', 'ml_optimizer'])
    
    args = parser.parse_args()
    generate_plan(args.date, args.use_api, args.solver, args.controller)

