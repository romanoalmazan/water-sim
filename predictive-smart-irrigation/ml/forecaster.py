"""Forecast wrapper for ML models."""

import pickle
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd
import numpy as np

import sys
from pathlib import Path
# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from weather.sources import get_forecast
from weather.features import build_features


class FarmForecaster:
    """Forecast irrigation water needs using ML models."""
    
    def __init__(self, models_dir: Optional[Path] = None):
        """
        Initialize forecaster.
        
        Args:
            models_dir: Directory containing model files
        """
        if models_dir is None:
            models_dir = Path(__file__).parent.parent / 'models'
        self.models_dir = Path(models_dir)
        self.models = {}
        self.feature_cols = None
        self._load_models()
    
    def _load_models(self):
        """Load trained models."""
        # Load feature columns
        feature_path = self.models_dir / 'feature_columns.pkl'
        if feature_path.exists():
            with open(feature_path, 'rb') as f:
                self.feature_cols = pickle.load(f)
        
        # Load P50 model
        p50_path = self.models_dir / 'need_model_p50.pkl'
        if p50_path.exists():
            with open(p50_path, 'rb') as f:
                self.models['p50'] = pickle.load(f)
        
        # Load quantile models
        for q_name in ['p10', 'p90']:
            q_path = self.models_dir / f'need_model_{q_name}.pkl'
            if q_path.exists():
                with open(q_path, 'rb') as f:
                    self.models[q_name] = pickle.load(f)
    
    def predict(
        self,
        date: datetime,
        field_ids: List[str],
        horizon_days: int = 1,
        source: str = "offline"
    ) -> Dict:
        """
        Predict irrigation needs for fields.
        
        Args:
            date: Date to forecast for
            field_ids: List of field IDs
            source: "api" or "offline"
            
        Returns:
            Dict with keys: 'p50', 'p10', 'p90' (dicts of field_id -> liters),
                           'et0' (series), 'rain' (series)
        """
        use_api = (source == "api")
        
        # Get weather forecast
        forecast_df = get_forecast(date, use_api=use_api)
        
        # Build features
        features_df = build_features(forecast_df)
        
        # Get most recent row (for next-day prediction)
        if len(features_df) > 0:
            latest_features = features_df.iloc[-1:].copy()
        else:
            # Fallback: create minimal features
            latest_features = pd.DataFrame({
                'temp_mean': [20.0],
                'rain_mm': [0.0],
                'et0': [5.0],
                'humidity': [60.0],
                'wind_speed': [5.0]
            })
        
        # Prepare feature vector
        if self.feature_cols and self.models.get('p50'):
            # Use same features as training
            available_cols = [c for c in self.feature_cols if c in latest_features.columns]
            missing_cols = [c for c in self.feature_cols if c not in latest_features.columns]
            
            X = latest_features[available_cols].values
            if missing_cols:
                # Pad with zeros for missing features
                X_padded = np.zeros((X.shape[0], len(self.feature_cols)))
                col_indices = [self.feature_cols.index(c) for c in available_cols]
                X_padded[:, col_indices] = X
                X = X_padded
        else:
            # Fallback: use basic features
            basic_cols = ['temp_mean', 'rain_mm', 'et0', 'humidity', 'wind_speed']
            X = latest_features[[c for c in basic_cols if c in latest_features.columns]].values
            if X.shape[1] < len(basic_cols):
                X = np.pad(X, ((0, 0), (0, len(basic_cols) - X.shape[1])), 'constant')
        
        # Predict for each field
        results = {
            'p50': {},
            'p10': {},
            'p90': {},
            'et0': forecast_df['et0'].sum() if 'et0' in forecast_df.columns else 0.0,
            'rain': forecast_df['rain_mm'].sum() if 'rain_mm' in forecast_df.columns else 0.0,
            'forecast_df': forecast_df
        }
        
        if self.models.get('p50'):
            for field_id in field_ids:
                # Predict P50
                pred_p50 = self.models['p50'].predict(X)[0]
                results['p50'][field_id] = max(0.0, pred_p50)
                
                # Predict quantiles if available
                if 'p10' in self.models:
                    pred_p10 = self.models['p10'].predict(X)[0]
                    results['p10'][field_id] = max(0.0, pred_p10)
                else:
                    results['p10'][field_id] = max(0.0, pred_p50 * 0.7)  # Fallback
                
                if 'p90' in self.models:
                    pred_p90 = self.models['p90'].predict(X)[0]
                    results['p90'][field_id] = max(0.0, pred_p90)
                else:
                    results['p90'][field_id] = max(0.0, pred_p50 * 1.3)  # Fallback
        else:
            # No model: use simple heuristic based on ET0
            base_liters = results['et0'] * 100  # Rough conversion
            for field_id in field_ids:
                results['p50'][field_id] = base_liters
                results['p10'][field_id] = base_liters * 0.7
                results['p90'][field_id] = base_liters * 1.3
        
        return results

