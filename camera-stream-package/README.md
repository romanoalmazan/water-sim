# Camera Stream Popup Package

This package contains all components, types, hooks, and backend server needed to add camera stream popup and screenshot capture functionality to your MapView.

## 📦 Package Contents

```
camera-stream-package/
├── README.md                    # This file
├── INTEGRATION.md               # Step-by-step integration guide
├── components/                  # React components
│   ├── CameraStreamModal.tsx    # Main popup modal
│   ├── PipeSegment.tsx          # Pipe visualization component
│   └── ScreenshotTable.tsx      # Screenshot display table
├── types/                       # TypeScript type definitions
│   ├── pipeData.ts              # Pipe segment data types
│   └── screenshot.ts            # Screenshot data types
├── hooks/                       # React hooks
│   └── usePipeData.ts           # Hook for pipe data (needs adaptation)
└── server/                      # Backend server
    └── index.js                 # Express server for screenshots
```

## 🚀 Quick Start

1. **Copy files** to your `ui/src/` directory (see INTEGRATION.md)
2. **Install dependencies**: `npm install html2canvas express cors`
3. **Start backend server**: `npm run server` (add script to package.json)
4. **Make MapView camera dots clickable** (see INTEGRATION.md)

## 📋 Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

## 🔧 Key Features

- **Camera Stream Popup**: Right-aligned modal (25vw × 75vh) showing animated pipe visualization
- **Screenshot Capture**: Capture PNG images with all associated data
- **Screenshot Table**: View all captured screenshots in a table
- **Camera Status Indicator**: Color-coded status (green/yellow/red) with flashing on warning
- **Data Display**: Shows Segment ID, Position, Water %, and Light values

## 📝 Integration Notes

- The `usePipeData` hook currently uses mock data - you'll need to adapt it to use your existing API
- Backend server runs on port 3001 (configurable in server/index.js)
- CameraStreamModal accepts `robotId` (SegmentID) and optional `screenshotData` for viewing saved screenshots

## 🎯 Next Steps

See `INTEGRATION.md` for detailed integration instructions.

