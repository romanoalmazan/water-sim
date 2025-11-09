"""Streamlit dashboard for predictive smart irrigation."""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
from pathlib import Path
import sys
import yaml

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.forecaster import FarmForecaster
from control.need_calc import calculate_all_fields_needs
from control.rules import baseline_controller, rule_based_controller
from control.scheduler import schedule_zones_greedy, schedule_zones_ortools
# Import generate functions directly
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from tools.generate_sample_data import generate_weather_history, generate_usage_history


# Page config
st.set_page_config(
    page_title="Predictive Smart Irrigation",
    page_icon="💧",
    layout="wide"
)

project_root = Path(__file__).parent.parent
data_dir = project_root / 'data'
config_dir = project_root / 'config'
outputs_dir = project_root / 'outputs'
outputs_dir.mkdir(exist_ok=True)


@st.cache_data
def load_config():
    """Load farm configuration."""
    config_path = config_dir / 'farm.yaml'
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


@st.cache_data
def load_soils_crops():
    """Load soils and crops data."""
    soils_df = pd.read_csv(data_dir / 'soils.csv')
    crops_df = pd.read_csv(data_dir / 'crops.csv')
    return soils_df, crops_df


def main():
    st.title("💧 Predictive Smart Irrigation System")
    st.markdown("Minimize water usage while maintaining healthy soil moisture")
    
    # Load configs
    config = load_config()
    soils_df, crops_df = load_soils_crops()
    
    # Sidebar
    with st.sidebar:
        st.header("Configuration")
        
        # Weather source
        use_api = st.checkbox("Use Weather API", value=False)
        
        # Date picker
        tomorrow = datetime.now() + timedelta(days=1)
        selected_date = st.date_input("Plan Date", value=tomorrow)
        
        # Controller selection
        controller = st.selectbox(
            "Controller",
            ["Baseline", "Rule-based", "ML + Optimizer"],
            index=2
        )
        
        # Risk parameters
        st.subheader("Risk Parameters")
        rain_quantile = st.select_slider(
            "Rain Quantile",
            options=["P10", "P50", "P90"],
            value="P10"
        )
        et0_quantile = st.select_slider(
            "ET0 Quantile",
            options=["P50", "P90"],
            value="P90"
        )
        safety_margin = st.slider("Safety Margin (mm)", 0.0, 5.0, 1.0, 0.1)
        
        # Scheduler
        solver = st.selectbox("Scheduler", ["Greedy", "OR-Tools"], index=0)
        
        # Actions
        st.subheader("Actions")
        if st.button("Generate Synthetic Week"):
            start_date = datetime.now() - timedelta(days=7)
            weather_df = generate_weather_history(start_date, 7)
            weather_path = data_dir / 'weather_history.csv'
            if weather_path.exists():
                existing = pd.read_csv(weather_path, parse_dates=['datetime'])
                weather_df = pd.concat([existing, weather_df]).drop_duplicates(subset=['date']).sort_values('date')
            weather_df.to_csv(weather_path, index=False)
            st.success("Generated synthetic week data")
        
        if st.button("Train Model"):
            with st.spinner("Training model..."):
                try:
                    import subprocess
                    result = subprocess.run(
                        [sys.executable, "-m", "ml.train"],
                        cwd=project_root,
                        capture_output=True,
                        text=True
                    )
                    if result.returncode == 0:
                        st.success("Model trained successfully!")
                        st.text(result.stdout)
                    else:
                        st.error(f"Training failed: {result.stderr}")
                except Exception as e:
                    st.error(f"Error: {e}")
        
        if st.button("Run Plan"):
            st.session_state.run_plan = True
    
    # Main area
    if st.session_state.get('run_plan', False):
        st.session_state.run_plan = False
        
        # Forecast
        with st.spinner("Forecasting..."):
            forecaster = FarmForecaster()
            field_ids = [f['id'] for f in config['fields']]
            forecast_result = forecaster.predict(
                datetime.combine(selected_date, datetime.min.time()),
                field_ids,
                source="api" if use_api else "offline"
            )
        
        # Prepare forecast dict
        rain_key = f"rain_{rain_quantile.lower()}"
        et0_key = f"et0_{et0_quantile.lower()}"
        
        forecast_dict = {
            'date': datetime.combine(selected_date, datetime.min.time()),
            'rain_p10': forecast_result.get('rain', 0.0) * 0.7,
            'rain_p50': forecast_result.get('rain', 0.0),
            'rain_p90': forecast_result.get('rain', 0.0) * 1.3,
            'et0_p50': forecast_result.get('et0', 5.0),
            'et0_p90': forecast_result.get('et0', 5.0) * 1.2
        }
        
        # Calculate needs
        fields = config['fields']
        
        if controller == "Baseline":
            fields_needs = baseline_controller(fields)
        elif controller == "Rule-based":
            fields_needs_raw = calculate_all_fields_needs(
                fields, soils_df, crops_df, forecast_dict,
                safety_margin_mm=safety_margin
            )
            fields_needs = rule_based_controller(fields_needs_raw, forecast_dict)
        else:  # ML + Optimizer
            fields_needs_raw = calculate_all_fields_needs(
                fields, soils_df, crops_df, forecast_dict,
                safety_margin_mm=safety_margin
            )
            # Override with ML if available
            for field_id, ml_liters in forecast_result.get('p50', {}).items():
                if field_id in fields_needs_raw:
                    field = next(f for f in fields if f['id'] == field_id)
                    from sim.agronomy import liters_to_minutes
                    minutes = liters_to_minutes(ml_liters, field['emitter_lpm'])
                    fields_needs_raw[field_id]['liters'] = ml_liters
                    fields_needs_raw[field_id]['minutes'] = minutes
            
            fields_needs = rule_based_controller(fields_needs_raw, forecast_dict)
        
        # Schedule
        with st.spinner("Scheduling..."):
            pump_qmax = config['pump']['qmax_lpm']
            window_start = config['window']['start']
            window_end = config['window']['end']
            plan_date = datetime.combine(selected_date, datetime.min.time())
            
            if solver == "OR-Tools":
                schedule = schedule_zones_ortools(
                    fields_needs, fields, pump_qmax,
                    window_start, window_end, plan_date
                )
            else:
                schedule = schedule_zones_greedy(
                    fields_needs, fields, pump_qmax,
                    window_start, window_end, plan_date
                )
        
        # KPIs
        total_liters = sum(f['liters'] for f in fields_needs.values())
        baseline_needs = baseline_controller(fields)
        baseline_liters = sum(f['liters'] for f in baseline_needs.values())
        saved_liters = baseline_liters - total_liters
        saved_pct = (saved_liters / baseline_liters * 100) if baseline_liters > 0 else 0
        
        scheduled_liters = sum(s['liters'] for s in schedule) if schedule else 0
        scheduled_minutes = sum(s['minutes'] for s in schedule) if schedule else 0
        
        # Rain avoided
        rain_avoided = 0.0
        for field_id, need_data in fields_needs.items():
            if need_data.get('rain_locked', False):
                baseline_field = baseline_needs.get(field_id, {})
                rain_avoided += baseline_field.get('liters', 0.0)
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Water", f"{total_liters:.0f} L", f"-{saved_liters:.0f} L")
        with col2:
            st.metric("Water Saved", f"{saved_pct:.1f}%", f"{saved_liters:.0f} L")
        with col3:
            st.metric("Rain Avoided", f"{rain_avoided:.0f} L")
        with col4:
            st.metric("Scheduled Time", f"{scheduled_minutes:.0f} min")
        
        # Plots
        st.subheader("Per-Field Water Plan")
        field_names = {f['id']: f['name'] for f in fields}
        plot_data = []
        for field_id, need_data in fields_needs.items():
            plot_data.append({
                'Field': field_names.get(field_id, field_id),
                'Liters': need_data['liters'],
                'Minutes': need_data['minutes']
            })
        
        plot_df = pd.DataFrame(plot_data)
        
        col1, col2 = st.columns(2)
        with col1:
            fig_bar = px.bar(plot_df, x='Field', y='Liters', title="Planned Water (Liters)")
            st.plotly_chart(fig_bar, use_container_width=True)
        
        with col2:
            fig_bar2 = px.bar(plot_df, x='Field', y='Minutes', title="Planned Runtime (Minutes)")
            st.plotly_chart(fig_bar2, use_container_width=True)
        
        # Forecast time series
        st.subheader("Weather Forecast")
        if 'forecast_df' in forecast_result and not forecast_result['forecast_df'].empty:
            forecast_df = forecast_result['forecast_df'].copy()
            forecast_df['hour'] = forecast_df['datetime'].dt.hour
            
            fig_forecast = go.Figure()
            fig_forecast.add_trace(go.Scatter(
                x=forecast_df['datetime'],
                y=forecast_df['et0'],
                name='ET0 (mm)',
                line=dict(color='orange')
            ))
            fig_forecast.add_trace(go.Scatter(
                x=forecast_df['datetime'],
                y=forecast_df['rain_mm'],
                name='Rain (mm)',
                line=dict(color='blue'),
                yaxis='y2'
            ))
            fig_forecast.update_layout(
                title="ET0 and Rain Forecast",
                xaxis_title="Time",
                yaxis_title="ET0 (mm)",
                yaxis2=dict(title="Rain (mm)", overlaying='y', side='right'),
                hovermode='x unified'
            )
            st.plotly_chart(fig_forecast, use_container_width=True)
        
        # Schedule Gantt
        st.subheader("Irrigation Schedule")
        if schedule:
            schedule_df = pd.DataFrame(schedule)
            schedule_df['start_ts'] = pd.to_datetime(schedule_df['start_ts'])
            schedule_df['end_ts'] = pd.to_datetime(schedule_df['end_ts'])
            schedule_df['duration'] = (schedule_df['end_ts'] - schedule_df['start_ts']).dt.total_seconds() / 60
            
            # Create Gantt chart
            fig_gantt = go.Figure()
            colors = px.colors.qualitative.Set3
            
            for idx, row in schedule_df.iterrows():
                field_name = field_names.get(row['field_id'], row['field_id'])
                fig_gantt.add_trace(go.Bar(
                    name=field_name,
                    x=[row['duration']],
                    y=[field_name],
                    orientation='h',
                    base=row['start_ts'],
                    marker_color=colors[idx % len(colors)],
                    text=f"{row['minutes']:.0f} min",
                    textposition='inside'
                ))
            
            fig_gantt.update_layout(
                title="Irrigation Schedule (Gantt)",
                xaxis_title="Time",
                yaxis_title="Field",
                barmode='overlay',
                height=300
            )
            st.plotly_chart(fig_gantt, use_container_width=True)
            
            # Schedule table
            st.dataframe(schedule_df[['field_id', 'start_ts', 'end_ts', 'minutes', 'liters']])
            
            # Export button
            csv_path = outputs_dir / f'schedule_{selected_date.strftime("%Y%m%d")}.csv'
            schedule_df.to_csv(csv_path, index=False)
            
            with open(csv_path, 'rb') as f:
                st.download_button(
                    "Download Schedule CSV",
                    f.read(),
                    file_name=f"schedule_{selected_date.strftime('%Y%m%d')}.csv",
                    mime="text/csv"
                )
        else:
            st.info("No schedule generated (no irrigation needed or constraints not feasible)")
    
    else:
        st.info("Configure settings in the sidebar and click 'Run Plan' to generate irrigation schedule")


if __name__ == '__main__':
    main()

