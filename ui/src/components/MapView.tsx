import { useEffect, useState, useRef } from 'react';
import type { Camera } from '../types/camera';
import './MapView.css';

interface MapViewProps {
  cameras: Camera[];
  onCameraClick?: (segmentId: number) => void;
}

// Calibration values from Python/Tkinter implementation
// Based on: (0, 0) @ (580, 253) and (3, 2) @ (1173, 830)
const X_SCALE_FACTOR = 197.6667; // (1173 - 580) / 3
const Y_SCALE_FACTOR = 288.50;   // (830 - 253) / 2
const X_OFFSET = 580;            // Pixel X position for API coordinate (0, 0)
const Y_OFFSET = 253;            // Pixel Y position for API coordinate (0, 0)

// Camera colors
const CAMERA_COLORS: Record<number, string> = {
  0: '#FF0000', // Red for Camera 0
  1: '#0000FF', // Blue for Camera 1
  2: '#00FF00', // Green for Camera 2
};

/**
 * Converts camera coordinates to pixel positions on the map
 * Uses the exact calibration formula from the Python/Tkinter implementation:
 * Pixel X = (API X * X_SCALE_FACTOR) + X_OFFSET
 * Pixel Y = (API Y * Y_SCALE_FACTOR) + Y_OFFSET
 */
function coordToPixel(x: number, y: number, mapWidth: number, mapHeight: number): { x: number; y: number } {
  // Use the calibrated formula directly
  const pixelX = (x * X_SCALE_FACTOR) + X_OFFSET;
  const pixelY = (y * Y_SCALE_FACTOR) + Y_OFFSET;
  
  return { x: pixelX, y: pixelY };
}

export function MapView({ cameras, onCameraClick }: MapViewProps) {
  const [mapDimensions, setMapDimensions] = useState({ width: 700, height: 700 });
  const [displaySize, setDisplaySize] = useState({ width: 700, height: 700 });
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get actual image dimensions when it loads
    const img = new Image();
    img.onload = () => {
      setMapDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = '/Map.png';
  }, []);

  useEffect(() => {
    const updateDisplaySize = () => {
      if (mapWrapperRef.current) {
        const rect = mapWrapperRef.current.getBoundingClientRect();
        setDisplaySize({ width: rect.width, height: rect.height });
      }
    };

    updateDisplaySize();
    window.addEventListener('resize', updateDisplaySize);
    return () => window.removeEventListener('resize', updateDisplaySize);
  }, []);

  return (
    <div className="map-container">
      <div className="map-wrapper" ref={mapWrapperRef}>
        <img 
          src="/Map.png" 
          alt="Sewer System Map" 
          className="map-image"
          onLoad={(e) => {
            const img = e.currentTarget;
            setMapDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            if (mapWrapperRef.current) {
              const rect = mapWrapperRef.current.getBoundingClientRect();
              setDisplaySize({ width: rect.width, height: rect.height });
            }
          }}
        />
        <svg 
          className="map-overlay" 
          width={displaySize.width}
          height={displaySize.height}
          viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {cameras.map((camera) => {
            const [x, y] = camera.Position;
            const position = coordToPixel(x, y, mapDimensions.width, mapDimensions.height);
            const color = CAMERA_COLORS[camera.SegmentID] || '#000000';
            
            // Debug: log positions (remove in production)
            if (process.env.NODE_ENV === 'development') {
              console.log(`Camera ${camera.SegmentID}: coord (${x.toFixed(2)}, ${y.toFixed(2)}) -> pixel (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
            }
            
            return (
              <g key={camera.SegmentID}>
                {/* Outer pulsing circle */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="15"
                  fill={color}
                  opacity="0.3"
                  className="camera-pulse-outer"
                  onClick={() => onCameraClick?.(camera.SegmentID)}
                  style={{ cursor: onCameraClick ? 'pointer' : 'default' }}
                />
                {/* Main camera dot */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="8"
                  fill={color}
                  className="camera-dot"
                  style={{ 
                    '--camera-color': color,
                    cursor: onCameraClick ? 'pointer' : 'default'
                  } as React.CSSProperties}
                  onClick={() => onCameraClick?.(camera.SegmentID)}
                />
                {/* Label */}
                <text
                  x={position.x}
                  y={position.y - 20}
                  textAnchor="middle"
                  className="camera-label"
                  fill={color}
                >
                  Camera {camera.SegmentID}
                </text>
                {/* Debug: show coordinates */}
                {process.env.NODE_ENV === 'development' && (
                  <text
                    x={position.x}
                    y={position.y + 35}
                    textAnchor="middle"
                    className="camera-debug"
                    fill="#666"
                    fontSize="10"
                  >
                    ({x.toFixed(2)}, {y.toFixed(2)})
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

