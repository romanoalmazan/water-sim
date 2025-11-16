"""Generate sample weather and usage history data."""

import argparse
import sys
from pathlib import Path
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from weather.sources import synthetic_forecast


def generate_weather_history(start_date: datetime, days: int) -> pd.DataFrame:
    """Generate historical weather data."""
    records = []
    
    for i in range(days):
        date = start_date + timedelta(days=i)
        # Generate hourly data for the day
        hourly = synthetic_forecast(date, hours=24)
        
        # Aggregate to daily
        daily = {
            'date': date.date(),
            'datetime': date,
            'temp_max': hourly['temp_max'].max(),
            'temp_min': hourly['temp_min'].min(),
            'temp_mean': hourly['temp_mean'].mean(),
            'humidity': hourly['humidity'].mean(),
            'wind_speed': hourly['wind_speed'].mean(),
            'pressure': hourly['pressure'].mean(),
            'rain_mm': hourly['rain_mm'].sum(),
            'et0': hourly['et0'].sum()
        }
        records.append(daily)
    
    return pd.DataFrame(records)


def generate_usage_history(
    start_date: datetime,
    days: int,
    field_ids: list[str],
    base_usage_liters: dict[str, float]
) -> pd.DataFrame:
    """Generate historical irrigation usage data."""
    records = []
    
    np.random.seed(42)
    
    for i in range(days):
        date = start_date + timedelta(days=i)
        
        # Generate usage for each field (with some variation)
        for field_id in field_ids:
            base = base_usage_liters.get(field_id, 1000.0)
            # Add seasonal and random variation
            day_of_year = date.timetuple().tm_yday
            seasonal_factor = 1.0 + 0.3 * np.sin(2 * np.pi * (day_of_year - 80) / 365)
            random_factor = np.random.lognormal(0, 0.2)
            
            water_liters = base * seasonal_factor * random_factor
            water_liters = max(0, water_liters)
            
            records.append({
                'date': date.date(),
                'field_id': field_id,
                'water_liters': water_liters
            })
    
    return pd.DataFrame(records)


def main():
    parser = argparse.ArgumentParser(description='Generate sample data')
    parser.add_argument('--days', type=int, default=60, help='Number of days')
    parser.add_argument('--start_date', type=str, default=None,
                       help='Start date (YYYY-MM-DD), defaults to N days ago')
    
    args = parser.parse_args()
    
    project_root = Path(__file__).parent.parent
    data_dir = project_root / 'data'
    data_dir.mkdir(exist_ok=True)
    
    # Determine start date
    if args.start_date:
        start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
    else:
        start_date = datetime.now() - timedelta(days=args.days)
    
    print(f"Generating {args.days} days of data starting from {start_date.date()}...")
    
    # Load field config to get field IDs
    config_path = project_root / 'config' / 'farm.yaml'
    if config_path.exists():
        import yaml
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        field_ids = [f['id'] for f in config.get('fields', [])]
        # Estimate base usage (rough: area * 2mm/day average)
        base_usage = {}
        for field in config.get('fields', []):
            area_m2 = field.get('area_m2', 10000)
            base_mm = 2.0  # Average 2mm/day
            base_usage[field['id']] = base_mm * area_m2 / 1000.0  # Convert to liters
    else:
        # Default fields
        field_ids = ['A', 'B']
        base_usage = {'A': 2000.0, 'B': 500.0}
    
    # Generate weather history
    print("Generating weather history...")
    weather_df = generate_weather_history(start_date, args.days)
    weather_path = data_dir / 'weather_history.csv'
    weather_df.to_csv(weather_path, index=False)
    print(f"Saved {weather_path}")
    
    # Generate usage history
    print("Generating usage history...")
    usage_df = generate_usage_history(start_date, args.days, field_ids, base_usage)
    usage_path = data_dir / 'usage_history.csv'
    usage_df.to_csv(usage_path, index=False)
    print(f"Saved {usage_path}")
    
    print(f"\nGenerated {len(weather_df)} weather records and {len(usage_df)} usage records")


if __name__ == '__main__':
    main()

