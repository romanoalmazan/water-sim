"""Quick verification script to check project setup."""

import sys
from pathlib import Path

print("Verifying project setup...")

# Check directories
required_dirs = ['config', 'data', 'models', 'app', 'sim', 'weather', 'ml', 'control', 'tools', 'tests']
project_root = Path(__file__).parent

for dir_name in required_dirs:
    dir_path = project_root / dir_name
    if dir_path.exists():
        print(f"✓ {dir_name}/ exists")
    else:
        print(f"✗ {dir_name}/ missing")

# Check config files
config_files = ['config/farm.yaml', 'config/model.yaml', 'data/soils.csv', 'data/crops.csv']
for config_file in config_files:
    file_path = project_root / config_file
    if file_path.exists():
        print(f"✓ {config_file} exists")
    else:
        print(f"✗ {config_file} missing")

# Check Python imports
print("\nTesting imports...")
try:
    import pandas
    print("✓ pandas")
except ImportError:
    print("✗ pandas not installed")

try:
    import numpy
    print("✓ numpy")
except ImportError:
    print("✗ numpy not installed")

try:
    import yaml
    print("✓ pyyaml")
except ImportError:
    print("✗ pyyaml not installed")

try:
    import lightgbm
    print("✓ lightgbm")
except ImportError:
    print("⚠ lightgbm not installed (will use RandomForest)")

try:
    from ortools.sat.python import cp_model
    print("✓ ortools")
except ImportError:
    print("⚠ ortools not installed (will use greedy scheduler)")

try:
    import streamlit
    print("✓ streamlit")
except ImportError:
    print("✗ streamlit not installed")

# Test module imports
sys.path.insert(0, str(project_root))
try:
    from weather.sources import synthetic_forecast
    print("✓ weather.sources")
except Exception as e:
    print(f"✗ weather.sources: {e}")

try:
    from sim.agronomy import mm_to_liters
    print("✓ sim.agronomy")
except Exception as e:
    print(f"✗ sim.agronomy: {e}")

try:
    from ml.forecaster import FarmForecaster
    print("✓ ml.forecaster")
except Exception as e:
    print(f"✗ ml.forecaster: {e}")

try:
    from control.need_calc import calculate_irrigation_needs
    print("✓ control.need_calc")
except Exception as e:
    print(f"✗ control.need_calc: {e}")

print("\nSetup verification complete!")

