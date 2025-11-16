"""Simple bucket model for soil moisture simulation."""

import numpy as np
from typing import Dict, Optional
import pandas as pd


class MoistureBucket:
    """Simple bucket model for tracking soil moisture."""
    
    def __init__(
        self,
        theta_init: float,
        theta_wilt: float,
        theta_fc: float,
        theta_sat: float,
        root_depth_mm: float
    ):
        """
        Initialize moisture bucket.
        
        Args:
            theta_init: Initial volumetric moisture content
            theta_wilt: Wilting point (volumetric)
            theta_fc: Field capacity (volumetric)
            theta_sat: Saturation (volumetric)
            root_depth_mm: Root zone depth (mm)
        """
        self.theta = theta_init
        self.theta_wilt = theta_wilt
        self.theta_fc = theta_fc
        self.theta_sat = theta_sat
        self.root_depth_mm = root_depth_mm
        
    def update(
        self,
        irrigation_mm: float,
        rain_mm: float,
        etc_mm: float,
        drainage_factor: float = 0.1
    ) -> Dict[str, float]:
        """
        Update moisture state.
        
        Args:
            irrigation_mm: Irrigation applied (mm)
            rain_mm: Effective rainfall (mm)
            etc_mm: Crop evapotranspiration (mm)
            drainage_factor: Fraction of excess that drains per day
            
        Returns:
            Dict with updated theta and losses
        """
        # Add water
        water_added_mm = irrigation_mm + rain_mm
        
        # Convert to volumetric change
        delta_theta = water_added_mm / self.root_depth_mm
        self.theta += delta_theta
        
        # Remove ET
        etc_theta = etc_mm / self.root_depth_mm
        self.theta = max(self.theta_wilt, self.theta - etc_theta)
        
        # Drainage if above field capacity
        if self.theta > self.theta_fc:
            excess = self.theta - self.theta_fc
            drained = excess * drainage_factor
            self.theta -= drained
            drainage_mm = drained * self.root_depth_mm
        else:
            drainage_mm = 0.0
        
        # Clip to saturation
        self.theta = min(self.theta_sat, self.theta)
        
        return {
            'theta': self.theta,
            'drainage_mm': drainage_mm,
            'water_added_mm': water_added_mm,
            'etc_mm': etc_mm
        }
    
    def get_deficit_mm(self, theta_target: float) -> float:
        """Calculate water deficit in mm to reach target moisture."""
        if self.theta >= theta_target:
            return 0.0
        deficit_theta = theta_target - self.theta
        return deficit_theta * self.root_depth_mm
    
    def get_free_storage_mm(self) -> float:
        """Get available storage capacity in mm."""
        if self.theta >= self.theta_fc:
            return 0.0
        free_theta = self.theta_fc - self.theta
        return free_theta * self.root_depth_mm

