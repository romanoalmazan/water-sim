import { useEffect, useState } from 'react';
import type { Camera } from '../types/camera';
import './MapView.css';

interface MapViewProps {
  cameras: Camera[];
}

// Coordinate ranges from the data: X: 0-3, Y: 0-2
const COORD_X_MIN = 0;
const COORD_X_MAX = 3;
const COORD_Y_MIN = 0;
const COORD_Y_MAX = 2;

// Camera colors
const CAMERA_COLORS: Record<number, string> = {
  0: '#FF0000', // Red for Camera 0
  1: '#0000FF', // Blue for Camera 1
  2: '#00FF00', // Green for Camera 2
};

/**
 * Converts camera coordinates to pixel positions on the map
 */
function coordToPixel(x: number, y: number, mapWidth: number, mapHeight: number): { x: number; y: number } {
  // Normalize coordinates to 0-1 range
  const normalizedX = (x - COORD_X_MIN) / (COORD_X_MAX - COORD_X_MIN);
  const normalizedY = (y - COORD_Y_MIN) / (COORD_Y_MAX - COORD_Y_MIN);
  
  // Convert to pixel positions
  const pixelX = normalizedX * mapWidth;
  const pixelY = normalizedY * mapHeight;
  
  return { x: pixelX, y: pixelY };
}

export function MapView({ cameras }: MapViewProps) {
  const [mapDimensions, setMapDimensions] = useState({ width: 700, height: 700 });

  useEffect(() => {
    // Get actual image dimensions when it loads
    const img = new Image();
    img.onload = () => {
      setMapDimensions({ width: img.width, height: img.height });
    };
    img.src = '/Map.png';
  }, []);

  return (
    <div className="map-container">
      <div className="map-wrapper">
        <img 
          src="/Map.png" 
          alt="Sewer System Map" 
          className="map-image"
          onLoad={(e) => {
            const img = e.currentTarget;
            setMapDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />
        <svg 
          className="map-overlay" 
          width="100%" 
          height="100%"
          viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
          preserveAspectRatio="none"
        >
          {cameras.map((camera) => {
            const [x, y] = camera.Position;
            const position = coordToPixel(x, y, mapDimensions.width, mapDimensions.height);
            const color = CAMERA_COLORS[camera.SegmentID] || '#000000';
            
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
                />
                {/* Main camera dot */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="8"
                  fill={color}
                  className="camera-dot"
                  style={{ '--camera-color': color } as React.CSSProperties}
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
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

