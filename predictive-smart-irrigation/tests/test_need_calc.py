"""Tests for irrigation need calculation."""

import pytest
import pandas as pd
from datetime import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from control.need_calc import calculate_irrigation_needs


def test_need_calc_basic():
    """Test basic need calculation."""
    field_config = {
        'area_m2': 10000,
        'soil': 'loam',
        'crop': 'greens',
        'emitter_lpm': 100,
        'theta_target_offset': 0.0,
        'daily_max_min': 180
    }
    
    soil_params = {
        'theta_wilt': 0.09,
        'theta_fc': 0.27,
        'theta_sat': 0.45,
        'infil_rate_mm_h': 12
    }
    
    crop_params = {
        'Kc_spring': 0.95,
        'Kc_summer': 1.05,
        'Kc_fall': 0.85,
        'Zr_mm': 300,
        'band_min_offset': -0.05,
        'band_max_offset': 0.02
    }
    
    forecast = {
        'date': datetime.now(),
        'rain_p50': 0.0,
        'et0_p50': 5.0,
        'et0_p90': 6.0
    }
    
    result = calculate_irrigation_needs(
        field_config,
        soil_params,
        crop_params,
        forecast,
        theta_now=0.25,
        safety_margin_mm=1.0
    )
    
    assert 'need_mm' in result
    assert 'liters' in result
    assert 'minutes' in result
    assert result['need_mm'] >= 0
    assert result['liters'] >= 0
    assert result['minutes'] >= 0


def test_need_calc_clips_to_max():
    """Test that need is clipped to avoid exceeding theta_max."""
    field_config = {
        'area_m2': 10000,
        'soil': 'loam',
        'crop': 'greens',
        'emitter_lpm': 100,
        'theta_target_offset': 0.0,
        'daily_max_min': 180
    }
    
    soil_params = {
        'theta_wilt': 0.09,
        'theta_fc': 0.27,
        'theta_sat': 0.45,
        'infil_rate_mm_h': 12
    }
    
    crop_params = {
        'Kc_spring': 0.95,
        'Kc_summer': 1.05,
        'Kc_fall': 0.85,
        'Zr_mm': 300,
        'band_min_offset': -0.05,
        'band_max_offset': 0.02
    }
    
    forecast = {
        'date': datetime.now(),
        'rain_p50': 0.0,
        'et0_p50': 5.0,
        'et0_p90': 6.0
    }
    
    # Start near field capacity
    result = calculate_irrigation_needs(
        field_config,
        soil_params,
        crop_params,
        forecast,
        theta_now=0.28,  # Near max
        safety_margin_mm=1.0
    )
    
    # Should be limited
    assert result['need_mm'] >= 0
    assert result['minutes'] <= field_config['daily_max_min']


def test_need_calc_rain_lock():
    """Test that effective rain reduces need."""
    field_config = {
        'area_m2': 10000,
        'soil': 'loam',
        'crop': 'greens',
        'emitter_lpm': 100,
        'theta_target_offset': 0.0,
        'daily_max_min': 180
    }
    
    soil_params = {
        'theta_wilt': 0.09,
        'theta_fc': 0.27,
        'theta_sat': 0.45,
        'infil_rate_mm_h': 12
    }
    
    crop_params = {
        'Kc_spring': 0.95,
        'Kc_summer': 1.05,
        'Kc_fall': 0.85,
        'Zr_mm': 300,
        'band_min_offset': -0.05,
        'band_max_offset': 0.02
    }
    
    # High rain forecast
    forecast_rain = {
        'date': datetime.now(),
        'rain_p50': 20.0,  # High rain
        'et0_p50': 5.0,
        'et0_p90': 6.0
    }
    
    # No rain forecast
    forecast_no_rain = {
        'date': datetime.now(),
        'rain_p50': 0.0,
        'et0_p50': 5.0,
        'et0_p90': 6.0
    }
    
    result_rain = calculate_irrigation_needs(
        field_config, soil_params, crop_params, forecast_rain,
        theta_now=0.27
    )
    
    result_no_rain = calculate_irrigation_needs(
        field_config, soil_params, crop_params, forecast_no_rain,
        theta_now=0.27
    )
    
    # With rain, need should be lower (or zero if rain covers everything)
    assert result_rain['need_mm'] <= result_no_rain['need_mm']

