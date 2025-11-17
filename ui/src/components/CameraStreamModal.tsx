import { useState, useEffect, useRef, useMemo } from 'react'
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
  const [waveOffset, setWaveOffset] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const animationFrameRef = useRef<number>()
  const captureRef = useRef<HTMLDivElement>(null)
  
  const isStaticMode = !!screenshotData
  
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
    if (screenshotData) {
      return screenshotData.segmentData
    }
    if (currentSegments.length === 0) {
      return null
    }
    return currentSegments.find(s => s.SegmentID === robotId) || currentSegments[0]
  }, [screenshotData, currentSegments, robotId])
  
  // Find the matching camera to get Position data - memoized to update when cameras change
  const segmentIdToFind = useMemo(() => {
    return isStaticMode && screenshotData 
      ? screenshotData.segmentData.SegmentID 
      : robotId
  }, [isStaticMode, screenshotData, robotId])
  
  const currentCamera = useMemo(() => {
    if (cameras.length === 0) {
      return null
    }
    return cameras.find(cam => cam.SegmentID === segmentIdToFind) || cameras[0]
  }, [cameras, segmentIdToFind])
  
  const position = useMemo(() => {
    return currentCamera ? currentCamera.Position : [0, 0]
  }, [currentCamera])

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
      // Wait multiple frames to ensure DOM is stable and water animation is visible
      // We want to capture the water animation at a specific frame
      await new Promise(resolve => requestAnimationFrame(resolve))
      await new Promise(resolve => requestAnimationFrame(resolve))
      await new Promise(resolve => setTimeout(resolve, 100)) // Additional delay for animation
      
      // Get the actual content element (PipeSegment or image) for dimension calculation
      const contentElement = captureRef.current.querySelector('div[style*="position: relative"]') || 
                            captureRef.current.querySelector('img') ||
                            captureRef.current
      
      // Get actual dimensions - ensure we have valid dimensions
      const rect = contentElement.getBoundingClientRect()
      const containerRect = captureRef.current.getBoundingClientRect()
      
      // Use the larger of content or container, with minimums
      // PipeSegment is 300px + 40px margin = 340px minimum
      const width = Math.max(
        rect.width || containerRect.width || captureRef.current.scrollWidth || 340,
        340
      )
      const height = Math.max(
        rect.height || containerRect.height || captureRef.current.scrollHeight || 340,
        340
      )
      
      console.log('Capturing with dimensions:', { width, height, rect, containerRect })
      
      // Capture the visualization as PNG - capture the water animation
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#242424',
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: false,
        logging: false, // Set to true for debugging html2canvas issues
        width: width,
        height: height,
        x: 0,
        y: 0,
        onclone: (clonedDoc) => {
          // Fix overflow issues in cloned document
          const clonedCaptureRef = clonedDoc.querySelector('[data-capture-ref]') as HTMLElement
          if (clonedCaptureRef) {
            clonedCaptureRef.style.overflow = 'visible'
            clonedCaptureRef.style.position = 'relative'
            // Ensure it has explicit dimensions
            if (!clonedCaptureRef.style.width) {
              clonedCaptureRef.style.width = `${width}px`
            }
            if (!clonedCaptureRef.style.height) {
              clonedCaptureRef.style.height = `${height}px`
            }
          }
          
          // Keep the water animation visible in the capture by NOT removing it
          // The wave animation should be captured as-is
          // Only remove flash animations that might interfere
          const flashAnimations = clonedDoc.querySelectorAll('[style*="flash"]')
          flashAnimations.forEach((el) => {
            const htmlEl = el as HTMLElement
            if (htmlEl.style.animation && htmlEl.style.animation.includes('flash')) {
              htmlEl.style.animation = 'none'
            }
          })
          
          // Fix overflow on all child elements
          const allElements = clonedDoc.querySelectorAll('*')
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            // Fix overflow on all child elements
            if (htmlEl.style.overflow === 'auto' || htmlEl.style.overflow === 'hidden') {
              htmlEl.style.overflow = 'visible'
            }
          })
        }
      })
      
      if (!canvas) {
        throw new Error('Failed to create canvas from html2canvas')
      }
      
      console.log('Canvas created:', { width: canvas.width, height: canvas.height })
      
      const imageData = canvas.toDataURL('image/png')
      
      if (!imageData || imageData === 'data:,') {
        throw new Error('Failed to generate image data from canvas')
      }
      
      // Validate image data format
      if (!imageData.startsWith('data:image/png;base64,')) {
        console.warn('Image data format unexpected:', imageData.substring(0, 50))
        // Try to fix it if it's just missing the prefix
        if (imageData.startsWith('data:image/')) {
          // It's a valid data URL, just different format
          console.log('Image data is valid but different format')
        } else {
          throw new Error('Invalid image data format - must be base64 PNG data URL')
        }
      }
      
      console.log('Image data generated, length:', imageData.length, 'starts with:', imageData.substring(0, 30))

      // Validate data before sending
      if (robotId === undefined || robotId === null) {
        throw new Error(`robotId is missing or invalid: ${robotId}`)
      }
      
      if (!imageData || imageData.length < 100) {
        throw new Error(`Image data is missing or too short: ${imageData?.length || 0} bytes`)
      }
      
      if (!currentSegment) {
        console.error('currentSegment is null:', { robotId, currentSegments, cameras })
        throw new Error('segmentData is missing - currentSegment is null. Make sure camera data is loaded.')
      }
      
      // Validate segmentData structure
      if (!currentSegment.SegmentID && currentSegment.SegmentID !== 0) {
        throw new Error(`segmentData is invalid - missing SegmentID. Segment data: ${JSON.stringify(currentSegment)}`)
      }

      // Prepare payload with all data
      const payload: ScreenshotPayload = {
        robotId,
        image: imageData,
        segmentData: currentSegment
      }

      console.log('Sending payload:', {
        robotId: payload.robotId,
        hasImage: !!payload.image,
        imageLength: payload.image?.length,
        hasSegmentData: !!payload.segmentData,
        segmentDataKeys: payload.segmentData ? Object.keys(payload.segmentData) : null,
        segmentData: payload.segmentData
      })

      // Send to screenshot server
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
        let errorMessage = `Failed to save screenshot: ${response.status} ${response.statusText}`
        try {
          // Clone response to read it without consuming the stream
          const clonedResponse = response.clone()
          const errorData = await clonedResponse.json()
          if (errorData.error) {
            errorMessage = `Error: ${errorData.error}`
            if (errorData.message) {
              errorMessage += ` - ${errorData.message}`
            }
            if (errorData.details) {
              console.error('Server error details:', errorData.details)
            }
          }
        } catch (e) {
          // If JSON parsing fails, try to get text
          try {
            const clonedResponse = response.clone()
            const errorText = await clonedResponse.text()
            if (errorText) {
              errorMessage += `\n${errorText}`
            }
          } catch (e2) {
            // Ignore if we can't get error text
            console.error('Could not read error response:', e2)
          }
        }
        console.error('Server error:', errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      if (error instanceof Error) {
        // Check if it's a network error (server not running)
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          alert('Error: Screenshot server not running. Please start it with "npm run server"')
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
          data-capture-ref="true"
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
          ) : currentSegment ? (
            // Live feed mode - show animated pipe
            <PipeSegment
              segment={currentSegment}
              waveOffset={waveOffset}
            />
          ) : (
            // Loading state when data is not available
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

