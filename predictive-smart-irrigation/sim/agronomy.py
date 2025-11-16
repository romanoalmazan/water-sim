"""Agronomy helper functions for ET0, effective rain, and unit conversions."""

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Optional


def season_kc(crop: str, date: datetime, crops_df: pd.DataFrame) -> float:
    """
    Get crop coefficient (Kc) for a given crop and date.
    
    Args:
        crop: Crop name (e.g., 'greens', 'orchard')
        date: Date to determine season
        crops_df: DataFrame with crop parameters
        
    Returns:
        Kc value for the crop and season
    """
    crop_row = crops_df[crops_df['crop'] == crop]
    if crop_row.empty:
        raise ValueError(f"Crop '{crop}' not found in crops data")
    
    month = date.month
    if month in [3, 4, 5]:  # Spring
        return crop_row['Kc_spring'].iloc[0]
    elif month in [6, 7, 8]:  # Summer
        return crop_row['Kc_summer'].iloc[0]
    else:  # Fall/Winter
        return crop_row['Kc_fall'].iloc[0]


def et0_hargreaves(temp_max: float, temp_min: float, ra: float = 15.0) -> float:
    """
    Calculate ET0 using Hargreaves-Samani equation (simplified).
    
    Args:
        temp_max: Maximum temperature (°C)
        temp_min: Minimum temperature (°C)
        ra: Extraterrestrial radiation (MJ/m²/day), default 15.0
        
    Returns:
        ET0 in mm/day
    """
    temp_mean = (temp_max + temp_min) / 2.0
    temp_range = temp_max - temp_min
    # Hargreaves-Samani: ET0 = 0.0023 * Ra * (Tmean + 17.8) * sqrt(TR)
    et0 = 0.0023 * ra * (temp_mean + 17.8) * np.sqrt(max(0.1, temp_range))
    return max(0.0, et0)


def effective_rain(
    theta_now: float,
    rain_forecast_mm: float,
    infil_rate_mm_h: float,
    free_storage_mm: float,
    window_hours: float = 4.0
) -> float:
    """
    Calculate effective rainfall considering infiltration capacity and storage.
    
    Args:
        theta_now: Current soil moisture (volumetric fraction)
        rain_forecast_mm: Forecasted rainfall (mm)
        infil_rate_mm_h: Infiltration rate (mm/hour)
        free_storage_mm: Available storage capacity (mm)
        window_hours: Time window for infiltration (hours)
        
    Returns:
        Effective rainfall (mm) that can be utilized
    """
    infiltration_capacity = infil_rate_mm_h * window_hours
    effective = min(rain_forecast_mm, infiltration_capacity, free_storage_mm)
    return max(0.0, effective)


def mm_to_liters(mm: float, area_m2: float) -> float:
    """Convert irrigation depth (mm) to volume (liters)."""
    return mm * area_m2 / 1000.0


def liters_to_minutes(liters: float, emitter_lpm: float) -> float:
    """Convert irrigation volume (liters) to runtime (minutes)."""
    if emitter_lpm <= 0:
        return 0.0
    return liters / emitter_lpm


def mm_to_minutes(mm: float, area_m2: float, emitter_lpm: float) -> float:
    """Convert irrigation depth (mm) directly to runtime (minutes)."""
    liters = mm_to_liters(mm, area_m2)
    return liters_to_minutes(liters, emitter_lpm)


def theta_to_mm(theta: float, root_depth_mm: float) -> float:
    """Convert volumetric soil moisture to equivalent water depth (mm)."""
    return theta * root_depth_mm


def mm_to_theta(mm: float, root_depth_mm: float) -> float:
    """Convert water depth (mm) to volumetric soil moisture."""
    if root_depth_mm <= 0:
        return 0.0
    return mm / root_depth_mm

