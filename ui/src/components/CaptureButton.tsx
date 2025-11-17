import { useState } from 'react';
import type { Camera } from '../types/camera';
import { captureVisualization } from '../services/captureService';
import './CaptureButton.css';

interface CaptureButtonProps {
  mapElementRef: React.RefObject<HTMLElement>;
  cameras: Camera[];
  onCapture?: () => void;
}

export function CaptureButton({ mapElementRef, cameras, onCapture }: CaptureButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState<Date | null>(null);

  const handleCapture = async () => {
    if (!mapElementRef.current || isCapturing) return;
    
    setIsCapturing(true);
    try {
      await captureVisualization(mapElementRef.current, cameras);
      setLastCaptureTime(new Date());
      onCapture?.();
    } catch (error) {
      console.error('Error capturing visualization:', error);
      alert('Failed to capture visualization. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="capture-button-container">
      <button
        className="capture-button"
        onClick={handleCapture}
        disabled={isCapturing || !mapElementRef.current}
        title="Capture current visualization and camera data"
      >
        {isCapturing ? 'Capturing...' : '📸 Capture'}
      </button>
      {lastCaptureTime && (
        <span className="last-capture-time">
          Last captured: {lastCaptureTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

