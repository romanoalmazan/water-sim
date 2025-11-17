import { useEffect, useState } from 'react';
import { CameraCard } from './components/CameraCard';
import { MapView } from './components/MapView';
import CameraStreamModal from './components/CameraStreamModal';
import { ScreenshotDatabase } from './components/ScreenshotDatabase';
import { fetchCameraData } from './services/api';
import { getScreenshots } from './services/screenshotApi';
import type { Camera } from './types/camera';
import type { ScreenshotData } from './types/screenshot';
import './App.css';

type ViewMode = 'live' | 'saved';

function App() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('live');
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

  useEffect(() => {
    const loadScreenshots = async () => {
      if (viewMode === 'saved') {
        try {
          const data = await getScreenshots();
          setScreenshots(data);
        } catch (err) {
          console.error('Error loading screenshots:', err);
        }
      }
    };

    loadScreenshots();
    
    // Refresh screenshots every 2 seconds when in saved mode
    if (viewMode === 'saved') {
      const interval = setInterval(loadScreenshots, 2000);
      return () => clearInterval(interval);
    }
  }, [viewMode, refreshDatabase]);

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

      {/* View Mode Toggle Buttons */}
      <div className="view-mode-buttons">
        <button 
          className={`view-mode-button ${viewMode === 'live' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('live');
            setSelectedScreenshot(null);
            setSelectedCameraId(null);
          }}
        >
          Live
        </button>
        <button 
          className={`view-mode-button ${viewMode === 'saved' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('saved');
            setSelectedCameraId(null);
            setSelectedScreenshot(null);
          }}
        >
          Saved
        </button>
      </div>

      {(viewMode === 'live' && cameras.length > 0) || (viewMode === 'saved') ? (
        <MapView 
          cameras={viewMode === 'live' ? cameras : []}
          screenshots={viewMode === 'saved' ? screenshots : []}
          viewMode={viewMode}
          onCameraClick={(segmentId) => {
            setSelectedCameraId(segmentId);
            setSelectedScreenshot(null);
          }}
          onScreenshotClick={(screenshot) => {
            setSelectedScreenshot(screenshot);
            setSelectedCameraId(null);
          }}
        />
      ) : null}

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
          setViewMode('saved'); // Switch to saved view when viewing from database
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

