import { useEffect, useState } from 'react';
import { CameraCard } from './components/CameraCard';
import { MapView } from './components/MapView';
import CameraStreamModal from './components/CameraStreamModal';
import { CapturedDataTable } from './components/CapturedDataTable';
import { fetchCameraData } from './services/api';
import { getAllCaptures } from './services/captureService';
import type { Camera } from './types/camera';
import type { CapturedRecord } from './services/captureService';
import './App.css';

function App() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [savedCapture, setSavedCapture] = useState<CapturedRecord | null>(null);
  const [captureTrigger, setCaptureTrigger] = useState(0);
  const [savedCaptures, setSavedCaptures] = useState<CapturedRecord[]>([]);

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

  // Load saved captures
  useEffect(() => {
    const loadSavedCaptures = () => {
      setSavedCaptures(getAllCaptures());
    };

    loadSavedCaptures();
    // Refresh every second to show new captures
    const intervalId = setInterval(loadSavedCaptures, 1000);
    return () => clearInterval(intervalId);
  }, [captureTrigger]);

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

      {cameras.length > 0 && (
        <div className="map-container-wrapper">
          <MapView 
            cameras={cameras} 
            onCameraClick={(segmentId) => {
              setSelectedCameraId(segmentId);
              setSavedCapture(null); // Clear saved capture when clicking live camera
            }}
            savedCaptures={savedCaptures}
            onSavedCaptureClick={(capture) => {
              setSavedCapture(capture);
              setSelectedCameraId(null); // Clear live view
            }}
          />
        </div>
      )}

      <div className="camera-list">
        {cameras.map((camera) => (
          <CameraCard key={camera.SegmentID} camera={camera} />
        ))}
      </div>

      <CapturedDataTable 
        key={captureTrigger}
        onViewCapture={(capture) => {
          setSavedCapture(capture);
          setSelectedCameraId(null); // Clear live view
        }}
      />

      {/* Camera Stream Modal - for live view or saved capture */}
      {(selectedCameraId !== null || savedCapture !== null) && (
        <CameraStreamModal
          robotId={selectedCameraId}
          cameras={cameras}
          savedCapture={savedCapture}
          onClose={() => {
            setSelectedCameraId(null);
            setSavedCapture(null);
          }}
        />
      )}
    </div>
  );
}

export default App;

