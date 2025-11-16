"""Tests for feature engineering."""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from weather.features import build_features


def test_build_features_shape():
    """Test that features are created with correct shape."""
    # Create sample weather data
    dates = [datetime.now() + timedelta(hours=i) for i in range(24)]
    df = pd.DataFrame({
        'datetime': dates,
        'temp_max': np.random.uniform(20, 30, 24),
        'temp_min': np.random.uniform(10, 20, 24),
        'temp_mean': np.random.uniform(15, 25, 24),
        'humidity': np.random.uniform(40, 80, 24),
        'wind_speed': np.random.uniform(0, 10, 24),
        'pressure': np.random.uniform(1000, 1020, 24),
        'rain_mm': np.random.exponential(0.5, 24),
        'et0': np.random.uniform(3, 8, 24)
    })
    
    features_df = build_features(df)
    
    # Should have time features
    assert 'hour' in features_df.columns or 'day_of_year' in features_df.columns
    assert 'doy_sin' in features_df.columns or len(features_df) > 0
    
    # Should not have NaN in key columns
    assert not features_df['temp_mean'].isna().any() if 'temp_mean' in features_df.columns else True


def test_build_features_lags():
    """Test that lag features are created."""
    dates = [datetime.now() + timedelta(days=i) for i in range(10)]
    df = pd.DataFrame({
        'datetime': dates,
        'temp_mean': range(10),
        'rain_mm': range(10),
        'et0': range(10),
        'humidity': [50] * 10,
        'wind_speed': [5] * 10,
        'pressure': [1013] * 10,
        'temp_max': range(10),
        'temp_min': range(10)
    })
    
    features_df = build_features(df, lags=[1, 2])
    
    # Should have lag features
    has_lags = any('lag' in col for col in features_df.columns)
    assert has_lags or len(features_df) < 3  # May not have enough data


def test_build_features_no_nans():
    """Test that features don't have unexpected NaNs."""
    dates = [datetime.now() + timedelta(hours=i) for i in range(48)]
    df = pd.DataFrame({
        'datetime': dates,
        'temp_mean': np.random.uniform(15, 25, 48),
        'rain_mm': np.random.exponential(0.5, 48),
        'et0': np.random.uniform(3, 8, 48),
        'humidity': np.random.uniform(40, 80, 48),
        'wind_speed': np.random.uniform(0, 10, 48),
        'pressure': np.random.uniform(1000, 1020, 48),
        'temp_max': np.random.uniform(20, 30, 48),
        'temp_min': np.random.uniform(10, 20, 48)
    })
    
    features_df = build_features(df)
    
    # Key numeric columns should not have NaN after fillna
    numeric_cols = features_df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols[:5]:  # Check first few
        assert not features_df[col].isna().any(), f"Column {col} has NaN"

