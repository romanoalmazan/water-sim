import { useState, useEffect, useRef } from 'react'
import { PipeSegment } from './PipeSegment'
import { ScreenshotPayload, ScreenshotData } from '../types/screenshot'
import type { Camera } from '../types/camera'
import type { PipeSegment as PipeSegmentType } from '../types/pipeData'
import { calculateStatus } from '../utils/statusCalculator'
import html2canvas from 'html2canvas'

interface CameraStreamModalProps {
  robotId: number
  onClose: () => void
  cameras: Camera[] // Use the same cameras data from App.tsx
  screenshotData?: ScreenshotData // If provided, show static image instead of live feed
}

const CameraStreamModal = ({ robotId, onClose, cameras, screenshotData }: CameraStreamModalProps) => {
  // Convert Camera[] to PipeSegment[] format
  const currentSegments: PipeSegmentType[] = cameras.map((cam: Camera) => ({
    SegmentID: cam.SegmentID,
    Water: cam.Water,
    Light: cam.Light
  }))
  const [waveOffset, setWaveOffset] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const animationFrameRef = useRef<number>()
  const captureRef = useRef<HTMLDivElement>(null)
  
  const isStaticMode = !!screenshotData
  const currentSegment = screenshotData 
    ? screenshotData.segmentData 
    : (currentSegments.find(s => s.SegmentID === robotId) || currentSegments[0])
  
  // Find the matching camera to get Position data (for live feed mode)
  // For static mode, we don't have position in screenshotData, so use cameras array
  const currentCamera = cameras.find(cam => cam.SegmentID === robotId) || cameras[0]
  const position = currentCamera ? currentCamera.Position : [0, 0]

  // Animate sin wave sliding effect using requestAnimationFrame (only for live feed)
  useEffect(() => {
    if (isStaticMode) return // Don't animate for static images
    
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
  }, [isStaticMode])

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

  const handleCaptureScreenshot = async () => {
    if (!captureRef.current) {
      console.error('Capture ref is null')
      alert('Error: Cannot capture screenshot - element not found')
      return
    }
    
    if (!currentSegment) {
      console.error('Current segment is null', { robotId, currentSegments })
      alert('Error: Cannot capture screenshot - segment data not found')
      return
    }

    setIsCapturing(true)
    try {
      // Wait a frame to ensure DOM is stable
      await new Promise(resolve => requestAnimationFrame(resolve))
      
      // Capture the visualization as PNG
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#242424',
        scale: 1,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: captureRef.current.scrollWidth,
        height: captureRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Remove any animations in the cloned document to prevent capture issues
          const animatedElements = clonedDoc.querySelectorAll('[style*="animation"]')
          animatedElements.forEach((el) => {
            (el as HTMLElement).style.animation = 'none'
          })
          // Also remove any inline styles with animation
          const allElements = clonedDoc.querySelectorAll('*')
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            if (htmlEl.style.animation) {
              htmlEl.style.animation = 'none'
            }
          })
        }
      })
      
      const imageData = canvas.toDataURL('image/png')

      // Prepare payload with all data
      const payload: ScreenshotPayload = {
        robotId,
        image: imageData,
        segmentData: currentSegment
      }

      // Send to backend
      const response = await fetch('http://localhost:3001/api/screenshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await response.json()
        alert('Screenshot captured and saved!')
      } else {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        alert(`Failed to save screenshot: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      if (error instanceof Error) {
        // Check if it's a network error (server not running)
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          alert('Error: Backend server not running. Please start it with "npm run server"')
        } else {
          alert(`Error capturing screenshot: ${error.message}. Check console for details.`)
        }
      } else {
        alert('Error capturing screenshot. Check console for details.')
      }
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
            {isStaticMode ? 'Screenshot Viewer' : `Camera Stream - Robot ${robotId}`}
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

        {/* Content - Visualization or Static Image */}
        <div
          ref={captureRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            overflow: 'auto'
          }}
        >
          {isStaticMode && screenshotData ? (
            // Static image mode - show PNG
            <img
              src={screenshotData.image}
              alt="Screenshot"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            // Live feed mode - show animated pipe
            currentSegment && (
              <PipeSegment
                segment={currentSegment}
                waveOffset={waveOffset}
              />
            )
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
          {currentSegment && (
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
          )}
          
          {/* Capture Button - Only show in live feed mode */}
          {!isStaticMode && (
            <button
              onClick={handleCaptureScreenshot}
              disabled={isCapturing}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: isCapturing ? '#666' : '#4a9eff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: isCapturing ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                width: '100%'
              }}
            >
              {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default CameraStreamModal

