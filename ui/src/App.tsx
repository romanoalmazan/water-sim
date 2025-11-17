import { useEffect, useState } from 'react';
import { CameraCard } from './components/CameraCard';
import { MapView } from './components/MapView';
import CameraStreamModal from './components/CameraStreamModal';
import { ScreenshotDatabase } from './components/ScreenshotDatabase';
import { fetchCameraData } from './services/api';
import type { Camera } from './types/camera';
import type { ScreenshotData } from './types/screenshot';
import './App.css';

function App() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotData | null>(null);
  const [refreshDatabase, setRefreshDatabase] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        const data = await fetchCameraData();
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

      {/* Camera Control Buttons */}
      <div className="camera-buttons">
        <button 
          className="camera-button camera-0"
          onClick={() => setSelectedCameraId(0)}
          disabled={loading || cameras.length === 0}
        >
          Camera 0
        </button>
        <button 
          className="camera-button camera-1"
          onClick={() => setSelectedCameraId(1)}
          disabled={loading || cameras.length === 0}
        >
          Camera 1
        </button>
        <button 
          className="camera-button camera-2"
          onClick={() => setSelectedCameraId(2)}
          disabled={loading || cameras.length === 0}
        >
          Camera 2
        </button>
      </div>

      {cameras.length > 0 && (
        <MapView 
          cameras={cameras} 
          onCameraClick={(segmentId) => setSelectedCameraId(segmentId)}
        />
      )}

      <div className="camera-list">
        {cameras.map((camera) => (
          <CameraCard key={camera.SegmentID} camera={camera} />
        ))}
      </div>

      {/* Screenshot Database */}
      <ScreenshotDatabase
        key={refreshDatabase}
        onViewScreenshot={(screenshot) => {
          setSelectedScreenshot(screenshot);
          setSelectedCameraId(screenshot.robotId);
        }}
      />

      {/* Camera Stream Modal - Live Feed */}
      {selectedCameraId !== null && !selectedScreenshot && (
        <CameraStreamModal
          robotId={selectedCameraId}
          cameras={cameras}
          onClose={() => setSelectedCameraId(null)}
          onScreenshotSaved={() => setRefreshDatabase(prev => prev + 1)}
        />
      )}

      {/* Camera Stream Modal - Historical Screenshot */}
      {selectedScreenshot && (
        <CameraStreamModal
          robotId={selectedScreenshot.robotId}
          cameras={cameras}
          screenshotData={selectedScreenshot}
          onClose={() => {
            setSelectedScreenshot(null);
            setSelectedCameraId(null);
          }}
        />
      )}
    </div>
  );
}

export default App;

