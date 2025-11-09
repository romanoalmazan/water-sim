"""Weather data sources: API clients and synthetic generator."""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not required for offline operation

try:
    import requests
except ImportError:
    requests = None  # requests not required for offline operation


def synthetic_forecast(date: datetime, hours: int = 24) -> pd.DataFrame:
    """
    Generate synthetic weather forecast for offline use.
    
    Args:
        date: Start date for forecast
        hours: Number of hours to forecast
        
    Returns:
        DataFrame with columns: datetime, temp_max, temp_min, temp_mean, 
                                humidity, wind_speed, pressure, rain_mm, et0
    """
    np.random.seed(int(date.timestamp()) % 10000)  # Deterministic based on date
    
    timestamps = [date + timedelta(hours=i) for i in range(hours)]
    
    # Seasonal temperature variation
    day_of_year = date.timetuple().tm_yday
    base_temp = 15 + 10 * np.sin(2 * np.pi * (day_of_year - 80) / 365)
    
    # Generate hourly data
    data = []
    for i, ts in enumerate(timestamps):
        hour = ts.hour
        
        # Temperature follows diurnal cycle
        temp_mean = base_temp + 5 * np.sin(2 * np.pi * (hour - 6) / 24)
        temp_max = temp_mean + np.random.normal(3, 1)
        temp_min = temp_mean - np.random.normal(3, 1)
        
        # Humidity inversely related to temperature
        humidity = max(30, min(95, 80 - (temp_mean - 15) * 2 + np.random.normal(0, 10)))
        
        # Wind speed
        wind_speed = max(0, np.random.lognormal(1.5, 0.5))
        
        # Pressure
        pressure = 1013 + np.random.normal(0, 5)
        
        # Rain: Poisson process with higher probability in afternoon
        rain_prob = 0.05 if hour < 12 else 0.15
        rain_mm = np.random.exponential(2.0) if np.random.random() < rain_prob else 0.0
        rain_mm = min(rain_mm, 10.0)  # Cap at 10mm/hour
        
        # ET0 using simplified Hargreaves
        ra = 15.0 + 5 * np.sin(2 * np.pi * (day_of_year - 80) / 365)
        et0 = 0.0023 * ra * (temp_mean + 17.8) * np.sqrt(max(0.1, temp_max - temp_min))
        et0 = max(0, et0)
        
        data.append({
            'datetime': ts,
            'temp_max': temp_max,
            'temp_min': temp_min,
            'temp_mean': temp_mean,
            'humidity': humidity,
            'wind_speed': wind_speed,
            'pressure': pressure,
            'rain_mm': rain_mm,
            'et0': et0
        })
    
    df = pd.DataFrame(data)
    return df


def fetch_openweather_forecast(lat: float = 40.0, lon: float = -120.0) -> Optional[pd.DataFrame]:
    """
    Fetch weather forecast from OpenWeather API.
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        DataFrame with forecast data or None if API fails
    """
    if requests is None:
        return None
    
    api_key = os.getenv('OPENWEATHER_API_KEY')
    if not api_key:
        return None
    
    try:
        url = f"http://api.openweathermap.org/data/2.5/forecast"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': api_key,
            'units': 'metric'
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        forecasts = []
        
        for item in data.get('list', []):
            dt = datetime.fromtimestamp(item['dt'])
            main = item['main']
            weather = item['weather'][0] if item.get('weather') else {}
            rain = item.get('rain', {}).get('3h', 0) / 3.0  # Convert 3h to hourly
            
            temp_mean = main['temp']
            temp_max = main.get('temp_max', temp_mean)
            temp_min = main.get('temp_min', temp_mean)
            
            # Estimate ET0
            ra = 15.0
            et0 = 0.0023 * ra * (temp_mean + 17.8) * np.sqrt(max(0.1, temp_max - temp_min))
            
            forecasts.append({
                'datetime': dt,
                'temp_max': temp_max,
                'temp_min': temp_min,
                'temp_mean': temp_mean,
                'humidity': main['humidity'],
                'wind_speed': item.get('wind', {}).get('speed', 0),
                'pressure': main['pressure'],
                'rain_mm': rain,
                'et0': et0
            })
        
        df = pd.DataFrame(forecasts)
        return df
        
    except Exception as e:
        print(f"OpenWeather API error: {e}")
        return None


def get_forecast(date: datetime, use_api: bool = False) -> pd.DataFrame:
    """
    Get weather forecast from API or synthetic generator.
    
    Args:
        date: Date for forecast
        use_api: Whether to use API (falls back to synthetic if fails)
        
    Returns:
        DataFrame with forecast data
    """
    if use_api:
        df = fetch_openweather_forecast()
        if df is not None and not df.empty:
            return df
    
    # Fall back to synthetic
    return synthetic_forecast(date, hours=48)  # 48h for better features

