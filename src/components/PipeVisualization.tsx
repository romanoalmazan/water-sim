import { useState, useEffect, useRef } from 'react'
import { usePipeData } from '../hooks/usePipeData'
import { PipeSegment } from './PipeSegment'

// Main visualization component
const PipeVisualization = () => {
  const currentSegments = usePipeData()
  const [selectedCamera, setSelectedCamera] = useState<number>(0)
  const [waveOffset, setWaveOffset] = useState(0)
  const animationFrameRef = useRef<number>()

  // Animate sin wave sliding effect using requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      setWaveOffset((prev) => prev + 0.1)
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Find the selected camera segment
  const currentSegment = currentSegments.find(s => s.SegmentID === selectedCamera) || currentSegments[0]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px'
      }}
    >
      <h2 style={{ marginBottom: '20px', color: '#fff' }}>Water Pipe Visualization</h2>
      
      {/* Camera selector toggle */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontSize: '16px', marginRight: '10px' }}>Camera:</span>
        {[0, 1, 2].map((cameraId) => (
          <button
            key={cameraId}
            onClick={() => setSelectedCamera(cameraId)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: selectedCamera === cameraId ? '#4a9eff' : '#555',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedCamera !== cameraId) {
                e.currentTarget.style.backgroundColor = '#666'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCamera !== cameraId) {
                e.currentTarget.style.backgroundColor = '#555'
              }
            }}
          >
            Camera {cameraId}
          </button>
        ))}
      </div>

      {/* Single pipe instance */}
      {currentSegment && (
        <PipeSegment
          segment={currentSegment}
          waveOffset={waveOffset}
        />
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
        Data updating every 1 second
      </div>
    </div>
  )
}

export default PipeVisualization

