"""Tests for forecast wrapper."""

import pytest
from datetime import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.forecaster import FarmForecaster


def test_forecaster_synthetic():
    """Test that synthetic forecast works."""
    forecaster = FarmForecaster()
    
    date = datetime.now()
    field_ids = ['A', 'B']
    
    result = forecaster.predict(date, field_ids, source="offline")
    
    assert 'p50' in result
    assert 'p10' in result
    assert 'p90' in result
    assert 'et0' in result
    assert 'rain' in result
    
    # Should have predictions for all fields
    for field_id in field_ids:
        assert field_id in result['p50']
        assert result['p50'][field_id] >= 0


def test_forecaster_returns_dict_keys():
    """Test that forecaster returns expected keys."""
    forecaster = FarmForecaster()
    
    date = datetime.now()
    field_ids = ['A']
    
    result = forecaster.predict(date, field_ids, source="offline")
    
    required_keys = ['p50', 'p10', 'p90', 'et0', 'rain']
    for key in required_keys:
        assert key in result


def test_forecaster_handles_missing_model():
    """Test that forecaster works even without trained models."""
    # This should work with fallback heuristics
    forecaster = FarmForecaster()
    
    date = datetime.now()
    field_ids = ['A', 'B']
    
    # Should not raise error even if models don't exist
    result = forecaster.predict(date, field_ids, source="offline")
    
    assert isinstance(result, dict)
    assert 'p50' in result

