"""Train ML models for irrigation water need prediction."""

import os
import sys
import pandas as pd
import numpy as np
import pickle
from pathlib import Path
import yaml
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Try LightGBM, fallback to RandomForest
try:
    import lightgbm as lgb
    USE_LIGHTGBM = True
except ImportError:
    from sklearn.ensemble import RandomForestRegressor
    USE_LIGHTGBM = False
    print("LightGBM not available, using RandomForest")

import sys
from pathlib import Path
# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from weather.features import build_features
from weather.sources import synthetic_forecast


def load_training_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load weather and usage history data."""
    data_dir = Path(__file__).parent.parent / 'data'
    
    weather_file = data_dir / 'weather_history.csv'
    usage_file = data_dir / 'usage_history.csv'
    
    if not weather_file.exists() or not usage_file.exists():
        raise FileNotFoundError(
            f"Training data not found. Run: python -m tools.generate_sample_data"
        )
    
    weather_df = pd.read_csv(weather_file, parse_dates=['datetime'])
    usage_df = pd.read_csv(usage_file)
    
    return weather_df, usage_df


def prepare_features(weather_df: pd.DataFrame, usage_df: pd.DataFrame) -> pd.DataFrame:
    """Prepare feature matrix and targets."""
    # Build features from weather
    weather_features = build_features(weather_df)
    
    # Merge with usage
    usage_df['date'] = pd.to_datetime(usage_df['date']).dt.date
    weather_features['date'] = pd.to_datetime(weather_features['datetime']).dt.date
    
    # Join on date only (weather is per-date, usage is per-date-per-field)
    merged = weather_features.merge(
        usage_df,
        on='date',
        how='inner'
    )
    
    # Feature columns (exclude targets and metadata)
    exclude_cols = ['date', 'datetime', 'field_id', 'water_liters', 'target']
    feature_cols = [c for c in merged.columns if c not in exclude_cols]
    
    return merged, feature_cols


def train_models():
    """Train P50 and quantile models."""
    print("Loading training data...")
    weather_df, usage_df = load_training_data()
    
    print("Preparing features...")
    merged, feature_cols = prepare_features(weather_df, usage_df)
    
    if merged.empty:
        raise ValueError("No training data after merging")
    
    print(f"Training on {len(merged)} samples with {len(feature_cols)} features")
    
    # Target: next-day water usage (already shifted in usage_history)
    # For now, use water_liters as target
    y = merged['water_liters'].values
    
    X = merged[feature_cols].values
    
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )
    
    models_dir = Path(__file__).parent.parent / 'models'
    models_dir.mkdir(exist_ok=True)
    
    # Train P50 model
    print("Training P50 model...")
    if USE_LIGHTGBM:
        model_p50 = lgb.LGBMRegressor(
            n_estimators=100,
            max_depth=7,
            learning_rate=0.1,
            random_state=42,
            verbose=-1
        )
    else:
        model_p50 = RandomForestRegressor(
            n_estimators=100,
            max_depth=7,
            random_state=42,
            n_jobs=-1
        )
    
    model_p50.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model_p50.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"P50 Model - MAE: {mae:.2f} L, RMSE: {rmse:.2f} L, R²: {r2:.3f}")
    
    # Save P50 model
    p50_path = models_dir / 'need_model_p50.pkl'
    with open(p50_path, 'wb') as f:
        pickle.dump(model_p50, f)
    print(f"Saved {p50_path}")
    
    # Train quantile models (P10, P90) if LightGBM available
    if USE_LIGHTGBM:
        print("Training quantile models...")
        for quantile in [0.1, 0.9]:
            model_q = lgb.LGBMRegressor(
                n_estimators=100,
                max_depth=7,
                learning_rate=0.1,
                random_state=42,
                objective='quantile',
                alpha=quantile,
                verbose=-1
            )
            model_q.fit(X_train, y_train)
            
            q_name = f"p{int(quantile * 100)}"
            q_path = models_dir / f'need_model_{q_name}.pkl'
            with open(q_path, 'wb') as f:
                pickle.dump(model_q, f)
            print(f"Saved {q_path}")
    else:
        # Simple approximation: use P50 ± std for P10/P90
        residuals = y_test - y_pred
        std_residual = np.std(residuals)
        print(f"Note: Using P50 ± {std_residual:.2f}L for P10/P90 (RandomForest)")
    
    # Save feature columns for inference
    feature_path = models_dir / 'feature_columns.pkl'
    with open(feature_path, 'wb') as f:
        pickle.dump(feature_cols, f)
    
    print("Training complete!")


if __name__ == '__main__':
    train_models()

