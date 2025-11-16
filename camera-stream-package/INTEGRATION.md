# Integration Guide

Step-by-step guide to integrate the camera stream popup into your MapView.

## Step 1: Install Dependencies

Add to your `ui/package.json`:

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1"
  },
  "scripts": {
    "server": "node server/index.js"
  }
}
```

For the backend server (in project root or separate server directory):

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

Run: `npm install`

## Step 2: Copy Files

Copy files to your project structure:

```
ui/src/
├── components/
│   ├── CameraStreamModal.tsx    # Copy from package/components/
│   ├── PipeSegment.tsx           # Copy from package/components/
│   └── ScreenshotTable.tsx      # Copy from package/components/
├── types/
│   ├── pipeData.ts              # Copy from package/types/
│   └── screenshot.ts            # Copy from package/types/
└── hooks/
    └── usePipeData.ts           # Copy from package/hooks/ (needs adaptation)

server/
└── index.js                     # Copy from package/server/
```

## Step 3: Adapt usePipeData Hook

The `usePipeData` hook currently uses mock data. Replace it with your existing API:

**Current (mock data):**
```typescript
import { mockData } from '../data/mockData'
// Cycles through mock data
```

**Adapted (using your API):**
```typescript
import { useState, useEffect } from 'react'
import { PipeSegment } from '../types/pipeData'
import { fetchCameraData } from '../services/api' // Your existing API

export const usePipeData = () => {
  const [segments, setSegments] = useState<PipeSegment[]>([])

  useEffect(() => {
    const loadData = async () => {
      const cameras = await fetchCameraData()
      // Convert Camera[] to PipeSegment[]
      const pipeSegments: PipeSegment[] = cameras.map(cam => ({
        SegmentID: cam.SegmentID,
        Water: cam.Water,
        Light: cam.Light
      }))
      setSegments(pipeSegments)
    }

    loadData()
    const interval = setInterval(loadData, 1000) // Poll every second
    return () => clearInterval(interval)
  }, [])

  return segments
}
```

## Step 4: Make MapView Camera Dots Clickable

Update `ui/src/components/MapView.tsx`:

```typescript
// Add onClick handler to camera dots
<circle
  cx={position.x}
  cy={position.y}
  r="8"
  fill={color}
  className="camera-dot"
  style={{ 
    '--camera-color': color,
    cursor: 'pointer'  // Add this
  } as React.CSSProperties}
  onClick={() => onCameraClick?.(camera.SegmentID)}  // Add this
/>
```

Update MapView interface:

```typescript
interface MapViewProps {
  cameras: Camera[];
  onCameraClick?: (segmentId: number) => void;  // Add this
}
```

## Step 5: Add Modal State to App Component

Update `ui/src/App.tsx`:

```typescript
import { useState } from 'react'
import CameraStreamModal from './components/CameraStreamModal'
import ScreenshotTable from './components/ScreenshotTable'
import { ScreenshotData } from './types/screenshot'

function App() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null)
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotData | null>(null)

  const handleCameraClick = (segmentId: number) => {
    setSelectedCameraId(segmentId)
    setSelectedScreenshot(null)
  }

  const handleScreenshotClick = (screenshot: ScreenshotData) => {
    setSelectedScreenshot(screenshot)
    setSelectedCameraId(null)
  }

  const handleCloseModal = () => {
    setSelectedCameraId(null)
    setSelectedScreenshot(null)
  }

  return (
    <div className="app">
      {/* Your existing header and MapView */}
      <MapView 
        cameras={cameras} 
        onCameraClick={handleCameraClick}  // Add this
      />

      {/* Screenshot Table (optional) */}
      <ScreenshotTable onScreenshotClick={handleScreenshotClick} />

      {/* Live Feed Modal */}
      {selectedCameraId !== null && (
        <CameraStreamModal
          robotId={selectedCameraId}
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
```

## Step 6: Start Backend Server

Add server script to your root `package.json`:

```json
{
  "scripts": {
    "server": "node server/index.js"
  }
}
```

Start in a separate terminal:
```bash
npm run server
```

Server runs on `http://localhost:3001`

## Step 7: Test Integration

1. Click a camera dot on the map
2. Popup should open showing animated pipe visualization
3. Click "Capture Screenshot" button
4. Screenshot should save and appear in the table
5. Click a screenshot in the table to view it

## Troubleshooting

- **Modal doesn't open**: Check that `onCameraClick` is passed to MapView
- **Screenshot capture fails**: Ensure backend server is running on port 3001
- **Data not showing**: Verify `usePipeData` hook is adapted to use your API
- **Type errors**: Ensure all types are copied and imported correctly

## Data Structure Mapping

Your `Camera` type should map to `PipeSegment`:

```typescript
// Your Camera type
interface Camera {
  SegmentID: number
  Water: number
  Light: number
  Position: [number, number]
  Status: string
}

// PipeSegment type (used by components)
interface PipeSegment {
  SegmentID: number
  Water: number
  Light: number
}
```

The mapping is straightforward - just extract SegmentID, Water, and Light from your Camera objects.

