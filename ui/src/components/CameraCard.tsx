import type { Camera } from '../types/camera';

interface CameraCardProps {
  camera: Camera;
}

export function CameraCard({ camera }: CameraCardProps) {
  const [x, y] = camera.Position;
  const waterPercent = (camera.Water * 100).toFixed(1);
  const lightValue = Math.round(camera.Light * 255);

  return (
    <div className="camera-card">
      <h3>Camera {camera.SegmentID}</h3>
      <div className="camera-info">
        <div className="info-row">
          <span className="label">Segment ID:</span>
          <span className="value">{camera.SegmentID}</span>
        </div>
        <div className="info-row">
          <span className="label">Position:</span>
          <span className="value">({x.toFixed(2)}, {y.toFixed(2)})</span>
        </div>
        <div className="info-row">
          <span className="label">Water Submersion:</span>
          <span className="value">{waterPercent}%</span>
        </div>
        <div className="info-row">
          <span className="label">Light Level:</span>
          <span className="value">{lightValue} / 255</span>
        </div>
        <div className="info-row">
          <span className="label">Status:</span>
          <span className={`value status status-${camera.Status.toLowerCase()}`}>
            {camera.Status}
          </span>
        </div>
      </div>
    </div>
  );
}

