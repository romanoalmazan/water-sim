import { useState } from 'react'
import TestMap from './components/TestMap'
import CameraStreamModal from './components/CameraStreamModal'
import ScreenshotTable from './components/ScreenshotTable'
import { ScreenshotData } from './types/screenshot'
import './App.css'

function App() {
  const [selectedRobotId, setSelectedRobotId] = useState<number | null>(null)
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotData | null>(null)

  const handleRobotClick = (robotId: number) => {
    setSelectedRobotId(robotId)
    setSelectedScreenshot(null) // Clear screenshot when opening live feed
  }

  const handleScreenshotClick = (screenshot: ScreenshotData) => {
    setSelectedScreenshot(screenshot)
    setSelectedRobotId(null) // Clear live feed when opening screenshot
  }

  const handleCloseModal = () => {
    setSelectedRobotId(null)
    setSelectedScreenshot(null)
  }

  return (
    <div className="App">
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Map Area */}
        <div style={{ flex: '0 0 auto' }}>
          <TestMap onRobotClick={handleRobotClick} />
        </div>
        
        {/* Screenshot Table Area */}
        <div style={{ flex: '1 1 auto', overflow: 'auto' }}>
          <ScreenshotTable onScreenshotClick={handleScreenshotClick} />
        </div>
      </div>
      
      {/* Live Feed Modal */}
      {selectedRobotId !== null && (
        <CameraStreamModal
          robotId={selectedRobotId}
          onClose={handleCloseModal}
        />
      )}
      
      {/* Screenshot Viewer Modal */}
      {selectedScreenshot !== null && (
        <CameraStreamModal
          robotId={selectedScreenshot.robotId}
          onClose={handleCloseModal}
          screenshotData={selectedScreenshot}
        />
      )}
    </div>
  )
}

export default App

