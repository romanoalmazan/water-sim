import { useEffect, useState } from 'react';
import { CameraCard } from './components/CameraCard';
import { fetchCameraData } from './services/api';
import type { Camera } from './types/camera';
import './App.css';

function App() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading camera data...');
        setError(null);
        const data = await fetchCameraData();
        console.log('Setting cameras:', data);
        setCameras(data);
        setLastUpdate(new Date());
        setLoading(false);
      } catch (err) {
        console.error('Error in loadData:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch camera data');
        setLoading(false);
      }
    };

    // Load data immediately
    loadData();

    // Set up polling every second (1000ms)
    const intervalId = setInterval(loadData, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sewer Camera System - Real-Time Dashboard</h1>
        {lastUpdate && (
          <p className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </header>

      {loading && cameras.length === 0 && (
        <div className="loading">Loading camera data...</div>
      )}

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      <div className="camera-list">
        {cameras.map((camera) => (
          <CameraCard key={camera.SegmentID} camera={camera} />
        ))}
      </div>
    </div>
  );
}

export default App;

