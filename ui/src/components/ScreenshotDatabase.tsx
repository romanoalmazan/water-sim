import { useEffect, useState } from 'react';
import { getScreenshots } from '../services/screenshotApi';
import type { ScreenshotData } from '../types/screenshot';
import './ScreenshotDatabase.css';

interface ScreenshotDatabaseProps {
  onViewScreenshot: (screenshot: ScreenshotData) => void;
}

export function ScreenshotDatabase({ onViewScreenshot }: ScreenshotDatabaseProps) {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScreenshots = async () => {
    try {
      setError(null);
      const data = await getScreenshots();
      setScreenshots(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading screenshots:', err);
      setError(err instanceof Error ? err.message : 'Failed to load screenshots');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScreenshots();
    
    // Refresh every 2 seconds to show new screenshots
    const interval = setInterval(loadScreenshots, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading && screenshots.length === 0) {
    return (
      <div className="screenshot-database">
        <h2>Screenshot Database</h2>
        <div className="loading">Loading screenshots...</div>
      </div>
    );
  }

  return (
    <div className="screenshot-database">
      <h2>Screenshot Database</h2>
      
      {error && (
        <div className="error">Error: {error}</div>
      )}

      {screenshots.length === 0 ? (
        <div className="no-screenshots">No screenshots captured yet.</div>
      ) : (
        <div className="screenshot-table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Camera</th>
                <th>Position</th>
                <th>Water</th>
                <th>Light</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {screenshots.map((screenshot) => (
                <tr key={screenshot.id}>
                  <td>{formatTimestamp(screenshot.timestamp)}</td>
                  <td>Camera {screenshot.robotId}</td>
                  <td>({screenshot.position[0].toFixed(2)}, {screenshot.position[1].toFixed(2)})</td>
                  <td>{(screenshot.water * 100).toFixed(1)}%</td>
                  <td>{Math.round(screenshot.light * 255)} / 255</td>
                  <td>
                    <button
                      className="view-button"
                      onClick={() => onViewScreenshot(screenshot)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

