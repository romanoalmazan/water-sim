"""Rule-based irrigation controllers."""

from typing import Dict, List
import pandas as pd
import sys
from pathlib import Path
# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def baseline_controller(fields: List[Dict]) -> Dict[str, Dict]:
    """
    Baseline fixed schedule controller.
    
    Args:
        fields: List of field configurations
        
    Returns:
        Dict mapping field_id -> {minutes, liters}
    """
    results = {}
    fixed_minutes = 20.0  # Fixed 20 minutes per field
    
    for field in fields:
        field_id = field['id']
        emitter_lpm = field['emitter_lpm']
        liters = fixed_minutes * emitter_lpm
        
        results[field_id] = {
            'minutes': fixed_minutes,
            'liters': liters,
            'need_mm': 0.0  # Not calculated
        }
    
    return results


def rule_based_controller(
    fields_needs: Dict[str, Dict],
    forecast: Dict,
    rain_threshold_mm: float = 5.0,
    emergency_theta_threshold: float = 0.12
) -> Dict[str, Dict]:
    """
    Rule-based controller with rain-lock and emergency rules.
    
    Args:
        fields_needs: Dict from need_calc with calculated needs
        forecast: Forecast dict with rain_p50, etc.
        rain_threshold_mm: Rain threshold to trigger rain-lock (mm)
        emergency_theta_threshold: Emergency moisture threshold
        
    Returns:
        Modified fields_needs dict
    """
    results = {}
    rain_p50 = forecast.get('rain_p50', 0.0)
    
    # Rain-lock: skip irrigation if significant rain expected
    rain_lock = rain_p50 >= rain_threshold_mm
    
    for field_id, need_data in fields_needs.items():
        result = need_data.copy()
        
        # Check for emergency (very low moisture)
        theta_now = need_data.get('theta_now', 0.2)
        is_emergency = theta_now < emergency_theta_threshold
        
        # Apply rain-lock unless emergency
        if rain_lock and not is_emergency:
            result['minutes'] = 0.0
            result['liters'] = 0.0
            result['need_mm'] = 0.0
            result['rain_locked'] = True
        else:
            result['rain_locked'] = False
        
        # Heatwave pre-hydration: small bump if ET0 very high
        et0_p90 = forecast.get('et0_p90', forecast.get('et0_p50', 5.0))
        if et0_p90 > 8.0 and not rain_lock:  # Very high ET0
            bonus_mm = 1.0
            result['need_mm'] += bonus_mm
            # Recalculate liters/minutes
            area_m2 = need_data.get('area_m2', 10000)  # Approximate
            emitter_lpm = need_data.get('emitter_lpm', 100)
            from sim.agronomy import mm_to_liters, liters_to_minutes  # noqa: E402
            bonus_liters = mm_to_liters(bonus_mm, area_m2)
            result['liters'] += bonus_liters
            result['minutes'] = liters_to_minutes(result['liters'], emitter_lpm)
        
        results[field_id] = result
    
    return results

