# Quick Start Guide

## For Cursor/AI Assistants

This package adds camera stream popup and screenshot functionality to the MapView. Here's what you need to know:

## Key Components

1. **CameraStreamModal** - Main popup component
   - Props: `robotId` (number), `onClose` (function), `screenshotData?` (optional)
   - Shows animated pipe visualization or static screenshot
   - Handles screenshot capture

2. **PipeSegment** - Renders the animated pipe visualization
   - Props: `segment` (PipeSegment), `waveOffset` (number)

3. **ScreenshotTable** - Displays all captured screenshots
   - Props: `onScreenshotClick` (function)

## Data Flow

```
MapView (click camera dot)
  → App (handleCameraClick)
    → CameraStreamModal (robotId)
      → usePipeData (fetch data)
        → PipeSegment (render visualization)
```

## Integration Checklist

- [ ] Copy all files from package to ui/src/
- [ ] Install dependencies: `html2canvas`
- [ ] Adapt `usePipeData` hook to use existing API
- [ ] Add `onCameraClick` prop to MapView
- [ ] Add modal state management to App
- [ ] Copy server/index.js and add npm script
- [ ] Start backend server on port 3001

## Common Adaptations Needed

1. **usePipeData Hook**: Replace mock data with your API call
2. **MapView**: Add `onClick` handler to camera dots
3. **App Component**: Add state for `selectedCameraId` and `selectedScreenshot`

## API Endpoints

- `POST /api/screenshots` - Save screenshot (port 3001)
- `GET /api/screenshots` - Get all screenshots (port 3001)

## Type Compatibility

Your `Camera` type should have:
- `SegmentID: number`
- `Water: number` (0-1)
- `Light: number` (0-1)

These map directly to `PipeSegment` type.

