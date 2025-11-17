import { useEffect, useState } from 'react';
import { getAllCaptures, deleteCapture, clearAllCaptures, exportCaptures, type CapturedRecord } from '../services/captureService';
import './CapturedDataTable.css';

interface CapturedDataTableProps {
  onViewCapture?: (capture: CapturedRecord) => void;
}

export function CapturedDataTable({ onViewCapture }: CapturedDataTableProps) {
  const [captures, setCaptures] = useState<CapturedRecord[]>([]);

  const loadCaptures = () => {
    setCaptures(getAllCaptures());
  };

  useEffect(() => {
    loadCaptures();
    // Refresh every second to show new captures
    const interval = setInterval(loadCaptures, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this capture?')) {
      deleteCapture(id);
      loadCaptures();
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all captures? This cannot be undone.')) {
      clearAllCaptures();
      loadCaptures();
    }
  };

  const handleExport = () => {
    exportCaptures();
  };

  const handleViewImage = (capture: CapturedRecord) => {
    if (onViewCapture) {
      onViewCapture(capture);
    }
  };

  return (
    <div className="captured-data-section">
      <div className="captured-data-header">
        <h2>Captured Data ({captures.length})</h2>
        <div className="captured-data-actions">
          <button onClick={handleExport} className="action-button export-button">
            Export JSON
          </button>
          {captures.length > 0 && (
            <button onClick={handleClearAll} className="action-button clear-button">
              Clear All
            </button>
          )}
        </div>
      </div>

      {captures.length === 0 ? (
        <div className="no-captures">
          No captures yet. Use the Capture button above to save visualizations and camera data.
        </div>
      ) : (
        <>
          <div className="captures-table-container">
            <table className="captures-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Cameras</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {captures.map((capture) => (
                  <tr key={capture.id}>
                    <td>{new Date(capture.timestamp).toLocaleString()}</td>
                    <td>
                      <div className="cameras-summary">
                        {capture.cameras.map((cam) => (
                          <span key={cam.SegmentID} className="camera-badge">
                            Camera {cam.SegmentID}: {cam.Status}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => handleViewImage(capture)}
                          className="action-button-small view-button"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(capture.id)}
                          className="action-button-small delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

