import { useState, useEffect } from 'react'
import { ScreenshotData } from '../types/screenshot'

interface ScreenshotTableProps {
  onScreenshotClick: (screenshot: ScreenshotData) => void
}

const ScreenshotTable = ({ onScreenshotClick }: ScreenshotTableProps) => {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScreenshots = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/screenshots', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setScreenshots(data)
        setError(null)
      } else {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        setError(`Failed to load screenshots: ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching screenshots:', err)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Screenshot server not running. Please start it with "npm run server"')
      } else {
        setError('Error connecting to server. Check console for details.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScreenshots()
    // Refresh every 2 seconds to get new screenshots
    const interval = setInterval(fetchScreenshots, 2000)
    return () => clearInterval(interval)
  }, [])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  if (loading && screenshots.length === 0) {
    return (
      <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
        Loading screenshots...
      </div>
    )
  }

  if (error && screenshots.length === 0) {
    return (
      <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%', overflowX: 'auto' }}>
      <h3 style={{ color: '#fff', marginBottom: '15px' }}>Screenshots</h3>
      {screenshots.length === 0 ? (
        <div style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
          No screenshots captured yet
        </div>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#2a2a2a' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#fff', borderBottom: '2px solid #4a9eff' }}>
                Timestamp
              </th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#fff', borderBottom: '2px solid #4a9eff' }}>
                Robot ID
              </th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#fff', borderBottom: '2px solid #4a9eff' }}>
                Segment ID
              </th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#fff', borderBottom: '2px solid #4a9eff' }}>
                Water
              </th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#fff', borderBottom: '2px solid #4a9eff' }}>
                Light
              </th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#fff', borderBottom: '2px solid #4a9eff' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {screenshots.map((screenshot) => (
              <tr
                key={screenshot.id}
                style={{
                  borderBottom: '1px solid #333',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={() => onScreenshotClick(screenshot)}
              >
                <td style={{ padding: '12px', color: '#fff' }}>
                  {formatTimestamp(screenshot.timestamp)}
                </td>
                <td style={{ padding: '12px', color: '#fff' }}>
                  {screenshot.robotId}
                </td>
                <td style={{ padding: '12px', color: '#fff' }}>
                  {screenshot.segmentData.SegmentID}
                </td>
                <td style={{ padding: '12px', color: '#fff' }}>
                  {(screenshot.segmentData.Water * 100).toFixed(1)}%
                </td>
                <td style={{ padding: '12px', color: '#fff' }}>
                  {screenshot.segmentData.Light.toFixed(3)}
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#4a9eff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onScreenshotClick(screenshot)
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ScreenshotTable

