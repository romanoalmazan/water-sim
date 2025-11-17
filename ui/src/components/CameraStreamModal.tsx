import { useState, useEffect, useRef, useMemo } from 'react'
import { PipeSegment } from './PipeSegment'
import type { Camera } from '../types/camera'
import type { PipeSegment as PipeSegmentType } from '../types/pipeData'
import { calculateStatus } from '../utils/statusCalculator'

interface CameraStreamModalProps {
  robotId: number
  onClose: () => void
  cameras: Camera[] // Use the same cameras data from App.tsx
}

const CameraStreamModal = ({ robotId, onClose, cameras }: CameraStreamModalProps) => {
  const [waveOffset, setWaveOffset] = useState(0)
  const animationFrameRef = useRef<number>()
  
  // Convert Camera[] to PipeSegment[] format - memoized to update when cameras change
  const currentSegments: PipeSegmentType[] = useMemo(() => {
    return cameras.map((cam: Camera) => ({
      SegmentID: cam.SegmentID,
      Water: cam.Water,
      Light: cam.Light
    }))
  }, [cameras])
  
  // Find the current segment - memoized to update when cameras or robotId change
  const currentSegment = useMemo(() => {
    if (currentSegments.length === 0) {
      return null
    }
    return currentSegments.find(s => s.SegmentID === robotId) || currentSegments[0]
  }, [currentSegments, robotId])
  
  // Find the matching camera to get Position data - memoized to update when cameras change
  const segmentIdToFind = useMemo(() => {
    return robotId
  }, [robotId])
  
  const currentCamera = useMemo(() => {
    if (cameras.length === 0) {
      return null
    }
    return cameras.find(cam => cam.SegmentID === segmentIdToFind) || cameras[0]
  }, [cameras, segmentIdToFind])
  
  const position = useMemo(() => {
    return currentCamera ? currentCamera.Position : [0, 0]
  }, [currentCamera])

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

  // Determine camera status based on Water and Light values (matching CameraCard logic)
  const getCameraStatus = () => {
    if (!currentSegment) return { color: '#666', text: 'Unknown', isWarning: false }
    const statusInfo = calculateStatus(currentSegment.Water, currentSegment.Light)
    return {
      color: statusInfo.color,
      text: statusInfo.status,
      isWarning: statusInfo.isWarning
    }
  }

  const cameraStatus = getCameraStatus()

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}
        onClick={onClose}
      />
      
      {/* Modal - 1/4 screen width, taller height, right-aligned */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          width: '25vw',
          height: '75vh',
          backgroundColor: '#242424',
          border: '2px solid #4a9eff',
          borderRadius: '8px',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 15px',
            borderBottom: '1px solid #4a9eff',
            backgroundColor: '#1a1a1a',
            position: 'relative'
          }}
        >
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
            Camera Stream - Robot {robotId}
          </h3>
          
          {/* Camera Status Indicator - Top Right */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '35px',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {/* Simple camera icon - circle with dot */}
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: `2px solid ${cameraStatus.color}`,
                backgroundColor: cameraStatus.isWarning ? cameraStatus.color : 'transparent',
                position: 'relative',
                animation: cameraStatus.isWarning ? 'flash 1s infinite' : 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: cameraStatus.isWarning ? '#fff' : cameraStatus.color
                }}
              />
            </div>
            <span
              style={{
                fontSize: '12px',
                color: cameraStatus.color,
                fontWeight: 'bold'
              }}
            >
              {cameraStatus.text}
            </span>
          </div>
          
          {/* Flash animation keyframes */}
          <style>{`
            @keyframes flash {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
          `}</style>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 5px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content - Visualization */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            overflow: 'auto',
            minHeight: '340px',
            minWidth: '340px'
          }}
        >
          {currentSegment ? (
            <PipeSegment
              segment={currentSegment}
              waveOffset={waveOffset}
            />
          ) : (
            <div style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>
              Loading camera data...
            </div>
          )}
        </div>

        {/* Footer - Data Display */}
        <div
          style={{
            padding: '10px 15px',
            borderTop: '1px solid #4a9eff',
            backgroundColor: '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Data Display */}
          {currentSegment ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12px',
                color: '#fff'
              }}
            >
              <div>
                <span style={{ color: '#aaa' }}>Segment ID: </span>
                <span style={{ fontWeight: 'bold' }}>{currentSegment.SegmentID}</span>
              </div>
              <div>
                <span style={{ color: '#aaa' }}>Position: </span>
                <span style={{ fontWeight: 'bold' }}>({position[0].toFixed(2)}, {position[1].toFixed(2)})</span>
              </div>
              <div>
                <span style={{ color: '#aaa' }}>Water: </span>
                <span style={{ fontWeight: 'bold' }}>{(currentSegment.Water * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span style={{ color: '#aaa' }}>Light: </span>
                <span style={{ fontWeight: 'bold' }}>{currentSegment.Light.toFixed(3)}</span>
              </div>
            </div>
          ) : (
            <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', padding: '10px' }}>
              Waiting for camera data...
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CameraStreamModal

