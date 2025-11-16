"""Calculate irrigation water needs per field."""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional

import sys
from pathlib import Path
# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sim.agronomy import (
    season_kc, effective_rain, mm_to_liters, liters_to_minutes,
    theta_to_mm, mm_to_theta
)


def calculate_irrigation_needs(
    field_config: Dict,
    soil_params: Dict,
    crop_params: Dict,
    forecast: Dict,
    theta_now: Optional[float] = None,
    safety_margin_mm: float = 1.0,
    window_hours: float = 4.0
) -> Dict:
    """
    Calculate irrigation water need for a field.
    
    Args:
        field_config: Field configuration (area_m2, soil, crop, emitter_lpm, etc.)
        soil_params: Soil parameters (theta_wilt, theta_fc, theta_sat, infil_rate_mm_h)
        crop_params: Crop parameters (Kc, Zr_mm, band offsets)
        forecast: Forecast dict with 'rain_p50', 'et0_p50', etc.
        theta_now: Current soil moisture (volumetric), if None uses theta_fc
        safety_margin_mm: Safety margin (mm)
        window_hours: Irrigation window duration (hours)
        
    Returns:
        Dict with Need_mm, liters, minutes, and intermediate values
    """
    # Get parameters
    area_m2 = field_config['area_m2']
    emitter_lpm = field_config['emitter_lpm']
    root_depth_mm = crop_params['Zr_mm']
    
    # Determine moisture band
    theta_wilt = soil_params['theta_wilt']
    theta_fc = soil_params['theta_fc']
    theta_sat = soil_params['theta_sat']
    
    # Target moisture with offset
    theta_target_offset = field_config.get('theta_target_offset', 0.0)
    theta_target = theta_fc + theta_target_offset
    theta_target = max(theta_wilt, min(theta_sat, theta_target))
    
    # Band limits
    band_min_offset = crop_params.get('band_min_offset', -0.05)
    band_max_offset = crop_params.get('band_max_offset', 0.02)
    theta_min = theta_fc + band_min_offset
    theta_max = theta_fc + band_max_offset
    theta_min = max(theta_wilt, theta_min)
    theta_max = min(theta_sat, theta_max)
    
    # Current moisture (default to field capacity if not provided)
    if theta_now is None:
        theta_now = theta_fc
    theta_now = max(theta_wilt, min(theta_sat, theta_now))
    
    # Step 1: Soil deficit
    if theta_now < theta_target:
        deficit_theta = theta_target - theta_now
        soil_deficit_mm = theta_to_mm(deficit_theta, root_depth_mm)
    else:
        soil_deficit_mm = 0.0
    
    # Step 2: ETc (use P90 for safety by default, allow override)
    et0_choice = forecast.get('et0_p90', forecast.get('et0_p50', 5.0))
    date = forecast.get('date', datetime.now())
    kc = season_kc(field_config['crop'], date, pd.DataFrame([crop_params]))
    etc_mm = kc * et0_choice
    
    # Step 3: Effective rain (use P10 for conservative estimate)
    rain_choice = forecast.get('rain_p10', forecast.get('rain_p50', 0.0))
    infil_rate = soil_params['infil_rate_mm_h']
    
    # Free storage
    free_storage_theta = max(0, theta_fc - theta_now)
    free_storage_mm = theta_to_mm(free_storage_theta, root_depth_mm)
    
    eff_rain_mm = effective_rain(
        theta_now,
        rain_choice,
        infil_rate,
        free_storage_mm,
        window_hours
    )
    
    # Step 4: Need calculation
    net_etc = max(0.0, etc_mm - eff_rain_mm)
    need_mm = max(0.0, soil_deficit_mm + net_etc + safety_margin_mm)
    
    # Step 5: Clip to avoid exceeding theta_max
    current_water_mm = theta_to_mm(theta_now, root_depth_mm)
    max_additional_mm = theta_to_mm(theta_max - theta_now, root_depth_mm)
    need_mm = min(need_mm, max_additional_mm)
    
    # Convert to liters and minutes
    liters = mm_to_liters(need_mm, area_m2)
    minutes = liters_to_minutes(liters, emitter_lpm)
    
    # Apply daily max limit
    daily_max_min = field_config.get('daily_max_min', 9999)
    minutes = min(minutes, daily_max_min)
    liters = minutes * emitter_lpm
    
    # Recalculate need_mm from final liters
    need_mm = liters / area_m2 * 1000.0
    
    return {
        'need_mm': need_mm,
        'liters': liters,
        'minutes': minutes,
        'soil_deficit_mm': soil_deficit_mm,
        'etc_mm': etc_mm,
        'eff_rain_mm': eff_rain_mm,
        'theta_now': theta_now,
        'theta_target': theta_target,
        'theta_min': theta_min,
        'theta_max': theta_max
    }


def calculate_all_fields_needs(
    fields: List[Dict],
    soils_df: pd.DataFrame,
    crops_df: pd.DataFrame,
    forecast: Dict,
    theta_now_dict: Optional[Dict[str, float]] = None,
    safety_margin_mm: float = 1.0,
    window_hours: float = 4.0
) -> Dict[str, Dict]:
    """
    Calculate needs for all fields.
    
    Returns:
        Dict mapping field_id -> need results
    """
    results = {}
    
    for field in fields:
        field_id = field['id']
        soil_name = field['soil']
        crop_name = field['crop']
        
        # Get soil and crop params
        soil_row = soils_df[soils_df['soil'] == soil_name]
        crop_row = crops_df[crops_df['crop'] == crop_name]
        
        if soil_row.empty or crop_row.empty:
            print(f"Warning: Missing params for field {field_id}")
            continue
        
        soil_params = soil_row.iloc[0].to_dict()
        crop_params = crop_row.iloc[0].to_dict()
        
        # Get current moisture
        theta_now = None
        if theta_now_dict and field_id in theta_now_dict:
            theta_now = theta_now_dict[field_id]
        
        # Calculate need
        need_result = calculate_irrigation_needs(
            field,
            soil_params,
            crop_params,
            forecast,
            theta_now=theta_now,
            safety_margin_mm=safety_margin_mm,
            window_hours=window_hours
        )
        
        results[field_id] = need_result
    
    return results

