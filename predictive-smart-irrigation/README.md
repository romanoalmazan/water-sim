# Predictive Smart Irrigation System

A complete, runnable irrigation management system for farms that **minimizes water usage** while maintaining healthy soil moisture levels. The system predicts tomorrow's water needs using weather forecasts and historical data, then schedules irrigations under farm constraints (pump limits, time windows, etc.).

## 🎯 Key Features

- **ML-Based Forecasting**: Predicts next-day irrigation needs using LightGBM/XGBoost with quantile models (P10/P50/P90) for uncertainty representation
- **Smart Scheduling**: OR-Tools CP-SAT optimizer (with greedy fallback) respects pump capacity and time windows
- **Rule-Based Control**: Rain-lock, emergency top-up, and heatwave pre-hydration rules
- **Offline Capable**: Synthetic weather generator and sample data for offline operation
- **Interactive Dashboard**: Streamlit UI with KPIs, plots, and schedule visualization
- **CLI Tools**: Command-line interface for data generation, training, and planning

## 🏗️ Architecture

```
┌─────────────────┐
│  Weather Source │──┐
│  (API/Synthetic)│  │
└─────────────────┘  │
                     ▼
              ┌──────────────┐
              │   Forecast   │
              │   Engine     │
              │  (LightGBM)  │
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Need Calc   │──► Soil Deficit + ETc - EffRain
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Scheduler   │──► Pump Capacity + Time Windows
              │ (OR-Tools)   │
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │   Schedule   │
              │     CSV      │
              └──────────────┘
```

## 🚀 Quick Start

### 1. Setup

```bash
cd predictive-smart-irrigation
make setup
```

This installs dependencies and creates a `.env` file from `.env.example`.

### 2. Generate Sample Data

```bash
make generate-data
# or
python -m tools.generate_sample_data --days 60
```

This creates:
- `data/weather_history.csv` - Historical weather data
- `data/usage_history.csv` - Historical irrigation usage per field

### 3. Train Models

```bash
make train
# or
python -m ml.train
```

This trains LightGBM models (P50, P10, P90) and saves them to `models/`.

### 4. Run Dashboard

```bash
make run
# or
streamlit run app/main.py
```

Open your browser to the URL shown (typically http://localhost:8501).

### 5. Generate Plan (CLI)

```bash
make plan DATE=2025-11-09
# or
python -m control.plan --date 2025-11-09 --use_api false --solver greedy
```

## 📁 Project Structure

```
predictive-smart-irrigation/
├── config/
│   ├── farm.yaml          # Farm configuration (fields, pump, windows)
│   └── model.yaml         # ML hyperparameters
├── data/
│   ├── weather_history.csv
│   ├── usage_history.csv
│   ├── crops.csv          # Crop parameters (Kc, root depth)
│   └── soils.csv          # Soil parameters (θ_wilt, θ_fc, θ_sat)
├── models/                # Trained ML models (*.pkl)
├── app/
│   └── main.py           # Streamlit dashboard
├── sim/
│   ├── agronomy.py       # ET0, effective rain, unit conversions
│   └── moisture.py       # Optional bucket model
├── weather/
│   ├── sources.py        # API client + synthetic generator
│   └── features.py       # ML feature engineering
├── ml/
│   ├── train.py          # Model training
│   └── forecaster.py    # Forecast wrapper
├── control/
│   ├── need_calc.py      # Irrigation need calculation
│   ├── rules.py          # Baseline + rule-based controllers
│   ├── scheduler.py      # OR-Tools + Greedy scheduler
│   └── plan.py           # CLI planning tool
├── tools/
│   └── generate_sample_data.py
├── tests/                # Unit tests
└── outputs/              # Generated schedules and reports
```

## ⚙️ Configuration

### Farm Configuration (`config/farm.yaml`)

```yaml
pump:
  qmax_lpm: 600  # Maximum pump capacity (L/min)

window:
  start: "02:00"
  end: "06:00"

fields:
  - id: "A"
    name: "Orchard North"
    area_m2: 20000
    soil: "loam"
    crop: "orchard"
    emitter_lpm: 120
    theta_target_offset: 0.00
    daily_max_min: 180
    priority: 2
```

### Weather API (Optional)

Edit `.env`:
```
OPENWEATHER_API_KEY=your_api_key_here
```

If no API key is provided, the system uses synthetic weather data.

## 🧮 Core Logic

### Irrigation Need Calculation

For each field:

1. **Soil Deficit**: `mm_to_reach_target = (θ_target - θ_now) × root_depth`
2. **ETc**: `ETc = Kc × ET0_forecast` (uses P90 for safety)
3. **Effective Rain**: `min(rain_forecast, infiltration_capacity, free_storage)`
4. **Need**: `max(0, SoilDeficit + max(0, ETc - EffRain) + SafetyMargin)`
5. **Clip**: Ensure post-irrigation θ ≤ θ_max

### Scheduling Constraints

- **Pump Capacity**: `Σ(active_emitters) ≤ Qmax`
- **Time Window**: All irrigation within specified hours
- **Priority**: Higher priority fields scheduled first (greedy)
- **Consecutive Slots**: Fields run for required duration (OR-Tools)

## 📊 Dashboard Features

### KPIs
- **Total Water**: Planned irrigation (liters)
- **Water Saved**: Percentage vs baseline fixed schedule
- **Rain Avoided**: Water saved due to rain-lock
- **Scheduled Time**: Total runtime (minutes)

### Visualizations
1. **Per-Field Water Plan**: Bar charts of liters and minutes
2. **Weather Forecast**: Time-series of ET0 and rain
3. **Schedule Gantt**: Visual timeline of irrigation schedule
4. **Moisture Bands**: (Optional) Soil moisture vs target band

### Controls
- Weather source toggle (API vs Synthetic)
- Controller selection (Baseline / Rule-based / ML + Optimizer)
- Risk sliders (Rain quantile, ET0 quantile, Safety margin)
- Scheduler selection (Greedy vs OR-Tools)

## 🧪 Testing

```bash
make test
# or
pytest tests/ -v
```

Tests cover:
- Feature engineering (lags, rolling stats)
- Need calculation (clipping, rain-lock)
- Scheduler (capacity, window constraints)
- Forecaster (synthetic data, model wrapper)

## 📝 CLI Usage

### Generate Sample Data
```bash
python -m tools.generate_sample_data --days 60 --start_date 2025-01-01
```

### Train Models
```bash
python -m ml.train
```

### Generate Plan
```bash
python -m control.plan \
  --date 2025-11-09 \
  --use_api false \
  --solver ortools \
  --controller ml_optimizer
```

## 🔬 Model Details

- **Algorithm**: LightGBM (falls back to RandomForest if unavailable)
- **Target**: Next-day irrigation water usage (liters) per field
- **Features**: Weather (temp, rain, ET0, humidity, wind), time (doy, hour), lags (1,2,3,7 days), rolling stats (3,7,14 days)
- **Quantiles**: P10, P50, P90 for uncertainty representation
- **Training**: 80/20 train/test split, MAE loss

## 🎓 Acceptance Criteria

✅ `make setup` installs dependencies and creates .env  
✅ `make generate-data` populates data/ directory  
✅ `make train` produces models/*.pkl  
✅ `streamlit run app/main.py` launches dashboard  
✅ Dashboard works offline with synthetic weather  
✅ Can train model, compute needs, generate schedule  
✅ Greedy scheduler works (OR-Tools optional)  
✅ Unit tests pass with pytest  
✅ Code is typed and documented  

## 📄 License

This project is designed for engineering competition use.

## 🤝 Contributing

This is a complete, runnable system. Extend by:
- Adding more weather sources
- Implementing additional ML models
- Adding more sophisticated moisture simulation
- Extending scheduler with zone conflicts

---

**Built for farms. Optimized for water efficiency.** 💧🌱

