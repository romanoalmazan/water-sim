"""Feature engineering for ML models."""

import numpy as np
import pandas as pd
from typing import List, Optional


def build_features(df: pd.DataFrame, lags: List[int] = [1, 2, 3, 7], 
                   rolling_windows: List[int] = [3, 7, 14]) -> pd.DataFrame:
    """
    Build ML features from weather DataFrame.
    
    Args:
        df: DataFrame with columns: datetime, temp_max, temp_min, temp_mean,
            humidity, wind_speed, pressure, rain_mm, et0
        lags: List of lag days to include
        rolling_windows: List of rolling window sizes (days)
        
    Returns:
        DataFrame with additional feature columns
    """
    df = df.copy()
    df = df.sort_values('datetime').reset_index(drop=True)
    
    # Ensure datetime is datetime type
    if not pd.api.types.is_datetime64_any_dtype(df['datetime']):
        df['datetime'] = pd.to_datetime(df['datetime'])
    
    # Time features
    df['hour'] = df['datetime'].dt.hour
    df['day_of_year'] = df['datetime'].dt.dayofyear
    df['month'] = df['datetime'].dt.month
    df['doy_sin'] = np.sin(2 * np.pi * df['day_of_year'] / 365.25)
    df['doy_cos'] = np.cos(2 * np.pi * df['day_of_year'] / 365.25)
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    
    # VPD (Vapor Pressure Deficit) approximation
    # VPD ≈ (1 - RH/100) * esat, where esat ≈ 0.611 * exp(17.27*T/(T+237.3))
    temp_k = df['temp_mean'] + 273.15
    esat = 0.611 * np.exp(17.27 * df['temp_mean'] / (df['temp_mean'] + 237.3))
    df['vpd'] = (1 - df['humidity'] / 100.0) * esat
    
    # Aggregate hourly to daily if needed
    if 'date' not in df.columns:
        df['date'] = df['datetime'].dt.date
    
    # Daily aggregation
    daily_cols = ['temp_max', 'temp_min', 'temp_mean', 'humidity', 
                  'wind_speed', 'pressure', 'rain_mm', 'et0']
    
    daily = df.groupby('date')[daily_cols].agg({
        'temp_max': 'max',
        'temp_min': 'min',
        'temp_mean': 'mean',
        'humidity': 'mean',
        'wind_speed': 'mean',
        'pressure': 'mean',
        'rain_mm': 'sum',
        'et0': 'sum'
    }).reset_index()
    
    daily['datetime'] = pd.to_datetime(daily['date'])
    daily = daily.sort_values('datetime').reset_index(drop=True)
    
    # Lag features
    for lag in lags:
        for col in ['temp_mean', 'rain_mm', 'et0', 'humidity', 'wind_speed']:
            if col in daily.columns:
                daily[f'{col}_lag{lag}'] = daily[col].shift(lag)
    
    # Rolling statistics
    for window in rolling_windows:
        for col in ['temp_mean', 'rain_mm', 'et0']:
            if col in daily.columns:
                daily[f'{col}_rolling_mean_{window}d'] = daily[col].rolling(window, min_periods=1).mean()
                daily[f'{col}_rolling_std_{window}d'] = daily[col].rolling(window, min_periods=1).std().fillna(0)
    
    # Fill NaN from lags/rolling
    daily = daily.bfill().fillna(0)
    
    return daily

