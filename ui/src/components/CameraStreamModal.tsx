import { useState, useEffect, useRef, useMemo } from 'react'
import { PipeSegment } from './PipeSegment'
import type { Camera } from '../types/camera'
import type { PipeSegment as PipeSegmentType } from '../types/pipeData'
import { calculateStatus } from '../utils/statusCalculator'
import { captureVisualization, type CapturedRecord } from '../services/captureService'
import html2canvas from 'html2canvas'

interface CameraStreamModalProps {
  robotId: number | null // null when viewing saved capture
  onClose: () => void
  cameras: Camera[] // Use the same cameras data from App.tsx
  savedCapture?: CapturedRecord | null // Optional saved capture to view
}

const CameraStreamModal = ({ robotId, onClose, cameras, savedCapture }: CameraStreamModalProps) => {
  const [waveOffset, setWaveOffset] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const animationFrameRef = useRef<number>()
  const pipeSegmentRef = useRef<HTMLDivElement>(null)
  
  // Determine if we're viewing a saved capture or live data
  const isViewingSavedCapture = savedCapture !== null && savedCapture !== undefined
  
  // For saved captures, use the camera data from the capture
  // For live view, use current cameras
  const displayCameras = isViewingSavedCapture ? savedCapture!.cameras : cameras
  const displayRobotId = isViewingSavedCapture 
    ? (savedCapture!.cameras[0]?.SegmentID ?? 0)
    : (robotId ?? 0)
  
  // Convert Camera[] to PipeSegment[] format - memoized to update when cameras change
  const currentSegments: PipeSegmentType[] = useMemo(() => {
    return displayCameras.map((cam: Camera) => ({
      SegmentID: cam.SegmentID,
      Water: cam.Water,
      Light: cam.Light
    }))
  }, [displayCameras])
  
  // Find the current segment - memoized to update when cameras or robotId change
  const currentSegment = useMemo(() => {
    if (currentSegments.length === 0) {
      return null
    }
    return currentSegments.find(s => s.SegmentID === displayRobotId) || currentSegments[0]
  }, [currentSegments, displayRobotId])
  
  // Find the matching camera to get Position data - memoized to update when cameras change
  const currentCamera = useMemo(() => {
    if (displayCameras.length === 0) {
      return null
    }
    return displayCameras.find(cam => cam.SegmentID === displayRobotId) || displayCameras[0]
  }, [displayCameras, displayRobotId])
  
  const position = useMemo(() => {
    return currentCamera ? currentCamera.Position : [0, 0]
  }, [currentCamera])

  // Animate sin wave sliding effect using requestAnimationFrame (only for live view)
  useEffect(() => {
    if (isViewingSavedCapture) {
      // Stop animation for saved captures
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }
    
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
  }, [isViewingSavedCapture])

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

  // Handle capture button click
  const handleCapture = async () => {
    if (!pipeSegmentRef.current || isCapturing || !currentCamera) return
    
    setIsCapturing(true)
    try {
      // Capture the pipe segment visualization
      const canvas = await html2canvas(pipeSegmentRef.current, {
        backgroundColor: '#242424',
        scale: 1,
        logging: false,
      })
      
      const pngDataUrl = canvas.toDataURL('image/png')
      
      // Create capture record with ONLY the current camera being viewed
      const record: CapturedRecord = {
        id: `capture_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date().toISOString(),
        pngDataUrl,
        cameras: [JSON.parse(JSON.stringify(currentCamera))], // Save only the current camera
      }
      
      // Save to localStorage
      const existingRecords = JSON.parse(localStorage.getItem('sewer_camera_captures') || '[]')
      existingRecords.push(record)
      localStorage.setItem('sewer_camera_captures', JSON.stringify(existingRecords))
      
      alert('Capture saved successfully!')
    } catch (error) {
      console.error('Error capturing visualization:', error)
      alert('Failed to capture visualization. Please try again.')
    } finally {
      setIsCapturing(false)
    }
  }

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
            {isViewingSavedCapture 
              ? `Saved Capture - ${new Date(savedCapture!.timestamp).toLocaleString()}`
              : `Camera Stream - Robot ${displayRobotId}`}
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
                animation: cameraStatus.isWarning && !isViewingSavedCapture ? 'flash 1s infinite' : 'none'
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
            <div ref={pipeSegmentRef}>
              <PipeSegment
                segment={currentSegment}
                waveOffset={waveOffset}
                static={isViewingSavedCapture}
              />
            </div>
          ) : (
            <div style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>
              Loading camera data...
            </div>
          )}
        </div>

        {/* Footer - Data Display and Capture Button */}
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
                gap: '12px',
                fontSize: '18px',
                color: '#fff'
              }}
            >
              <div>
                <span style={{ color: '#aaa', fontSize: '18px' }}>Segment ID: </span>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{currentSegment.SegmentID}</span>
              </div>
              <div>
                <span style={{ color: '#aaa', fontSize: '18px' }}>Position: </span>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>({position[0].toFixed(2)}, {position[1].toFixed(2)})</span>
              </div>
              <div>
                <span style={{ color: '#aaa', fontSize: '18px' }}>Water: </span>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{(currentSegment.Water * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span style={{ color: '#aaa', fontSize: '18px' }}>Light: </span>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{currentSegment.Light.toFixed(3)}</span>
              </div>
            </div>
          ) : (
            <div style={{ color: '#aaa', fontSize: '18px', textAlign: 'center', padding: '10px' }}>
              Waiting for camera data...
            </div>
          )}
          
          {/* Capture Button - only show for live view */}
          {!isViewingSavedCapture && (
            <button
              onClick={handleCapture}
              disabled={isCapturing || !pipeSegmentRef.current || !currentCamera}
              style={{
                background: isCapturing ? '#666' : '#1976d2',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isCapturing || !pipeSegmentRef.current || !currentCamera ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isCapturing || !pipeSegmentRef.current || !currentCamera ? 0.6 : 1,
                width: '100%'
              }}
            >
              {isCapturing ? 'Capturing...' : '📸 Capture'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default CameraStreamModal
