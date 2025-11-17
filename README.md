# Water Sim - Sewer Camera System Dashboard

A real-time dashboard for monitoring sewer camera robots with live data visualization, interactive map tracking, and screenshot capture capabilities. Built with React, TypeScript, and Express.

## 🎯 Project Overview

This project simulates a sewer inspection system where three robotic cameras navigate through a sewer network, collecting real-time data on water levels, light conditions, and position. The system provides:

- **Real-time monitoring** of camera positions and sensor data
- **Interactive map visualization** showing camera locations
- **Animated pipe visualization** displaying water levels and light conditions
- **Screenshot capture** for historical record-keeping
- **Status monitoring** with automatic warning detection

## 🏗️ Architecture

The project follows a **3-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  Port 5173 - UI Components, Map View, Visualizations   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Requests
         ┌───────────┴───────────┐
         │                       │
┌────────┴────────┐    ┌─────────┴──────────┐
│ Camera Data API │    │ Screenshot API     │
│  Port 3000      │    │ Port 3001          │
│ Simulation      │    │ Persistence        │
└─────────────────┘    └────────────────────┘
```

## 📁 Project Structure

```
water-sim/
├── ec-2025/                    # Camera Data Backend Server
│   ├── api/
│   │   ├── datagen.ts         # Core simulation engine
│   │   ├── json.ts            # JSON API endpoint
│   │   └── csv.ts             # CSV API endpoint
│   ├── index.ts               # Express server (Port 3000)
│   └── package.json
│
├── screenshot-api/            # Screenshot Storage API
│   ├── screenshots.ts         # CRUD operations
│   ├── screenshots.json       # JSON database file
│   ├── index.ts               # Express server (Port 3001)
│   └── package.json
│
└── ui/                        # Frontend React Application
    ├── src/
    │   ├── components/
    │   │   ├── App.tsx                    # Main application orchestrator
    │   │   ├── MapView.tsx               # Interactive map component
    │   │   ├── CameraCard.tsx           # Camera status cards
    │   │   ├── CameraStreamModal.tsx     # Live/historical viewer
    │   │   ├── PipeSegment.tsx           # Animated pipe visualization
    │   │   └── ScreenshotDatabase.tsx    # Screenshot management table
    │   ├── services/
    │   │   ├── api.ts                    # Camera data API client
    │   │   └── screenshotApi.ts          # Screenshot API client
    │   ├── types/                        # TypeScript type definitions
    │   ├── utils/
    │   │   └── statusCalculator.ts      # Status calculation logic
    │   └── main.tsx                      # Application entry point
    ├── public/
    │   └── Map.png                       # Sewer system map image
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- Three terminal windows (one for each server)

### Installation

```bash
# Install camera data backend dependencies
cd ec-2025
npm install

# Install screenshot API dependencies
cd ../screenshot-api
npm install

# Install frontend dependencies
cd ../ui
npm install
```

### Running the Application

#### Terminal 1: Camera Data Backend

```bash
cd ec-2025
npx tsx index.ts
```

Expected output:
```
============================================================
Server Ready on http://localhost:3000
============================================================
Available API endpoints:
  GET  /api/json       - Camera data (JSON)
  GET  /api/csv        - Camera data (CSV)
============================================================
```

#### Terminal 2: Screenshot API Server

```bash
cd screenshot-api
npx tsx index.ts
```

Expected output:
```
============================================================
Screenshot API Server Ready on http://localhost:3001
============================================================
Available API endpoints:
  POST   /api/screenshots - Save screenshot
  GET    /api/screenshots - Get all screenshots
  DELETE /api/screenshots - Clear all screenshots
============================================================
Screenshot database file: screenshot-api/screenshots.json
============================================================
```

#### Terminal 3: Frontend Development Server

```bash
cd ui
npm run dev
```

The dashboard will be available at **http://localhost:5173**

## ✨ Features

### Real-time Monitoring
- **Live data updates** every second for all 3 cameras
- **Automatic status calculation** (OK, LOWLIGHT, WARNING)
- **Position tracking** on interactive map

### Interactive Map View
- **Visual tracking** of camera positions with color-coded markers
- **Coordinate transformation** from API coordinates to pixel positions
- **Live and Saved modes** for viewing current or historical data
- **Click-to-view** camera streams

### Camera Visualization
- **Animated pipe segments** showing water levels with sine wave effects
- **Light-based color tinting** (clean blue to dirty brown)
- **Real-time water level** visualization
- **Status indicators** with color-coded warnings

### Screenshot Management
- **Capture screenshots** of camera visualizations
- **Metadata storage** (position, water level, light, timestamp)
- **Historical browsing** in database table
- **View saved screenshots** with full context

## 🔌 API Documentation

### Camera Data Backend (Port 3000)

#### `GET /api/json`
Returns camera data as JSON array.

**Response:**
```json
[
  {
    "SegmentID": 0,
    "Position": [0.5, 0.5],
    "Water": 0.3,
    "Light": 0.478,
    "Status": "OK"
  },
  ...
]
```

#### `GET /api/csv`
Returns camera data as CSV format.

### Screenshot API Backend (Port 3001)

#### `POST /api/screenshots`
Save a screenshot with metadata.

**Request Body:**
```json
{
  "robotId": 0,
  "image": "data:image/png;base64,...",
  "segmentData": {
    "SegmentID": 0,
    "Water": 0.3,
    "Light": 0.478
  },
  "position": [0.5, 0.5]
}
```

**Response:**
```json
{
  "success": true,
  "id": "screenshot-1234567890-abc123"
}
```

#### `GET /api/screenshots`
Get all saved screenshots, sorted by timestamp (newest first).

**Response:**
```json
[
  {
    "id": "screenshot-1234567890-abc123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "robotId": 0,
    "position": [0.5, 0.5],
    "water": 0.3,
    "light": 0.478,
    "image": "data:image/png;base64,..."
  },
  ...
]
```

#### `DELETE /api/screenshots`
Clear all saved screenshots.

**Response:**
```json
{
  "success": true,
  "message": "All screenshots cleared"
}
```

## 💻 Code Organization (Presentation Guide)

### Module 1: Backend Data Generation & Simulation Engine
**Files:** `ec-2025/api/datagen.ts`, `ec-2025/api/json.ts`

**Key Components:**
- `AnimatedPos` class - Handles camera path animation along predefined routes
- `ComputeWater()` - Simulates water flow physics through sewer network
- `ComputeLight()` - Calculates light intensity based on distance from manholes
- `generateData()` - Main function generating real-time camera data

**Technical Highlights:**
- Path-based animation system with time-based interpolation
- Water flow simulation with delay propagation
- Exponential decay for light intensity calculation
- Three cameras following different paths

### Module 2: Backend Screenshot API & Data Persistence
**Files:** `screenshot-api/index.ts`, `screenshot-api/screenshots.ts`

**Key Components:**
- RESTful API endpoints (POST, GET, DELETE)
- JSON file-based persistence (`screenshots.json`)
- CORS configuration for cross-origin requests
- Screenshot metadata management

**Technical Highlights:**
- File system operations for persistence
- Base64 image encoding/decoding
- Timestamp-based sorting
- Error handling and validation

### Module 3: Frontend Visualization Components & UI
**Files:** `ui/src/components/CameraCard.tsx`, `ui/src/components/PipeSegment.tsx`, `ui/src/components/CameraStreamModal.tsx`, `ui/src/utils/statusCalculator.ts`

**Key Components:**
- `CameraCard` - Displays camera status and sensor data
- `PipeSegment` - Animated SVG pipe visualization with water waves
- `CameraStreamModal` - Modal for viewing live feeds and historical screenshots
- `statusCalculator` - Determines camera status based on thresholds

**Technical Highlights:**
- SVG-based animations with `requestAnimationFrame`
- Sine wave generation for water surface effects
- Light-to-color mapping algorithm
- Screenshot capture using `html2canvas`
- Status calculation with configurable thresholds

### Module 4: Frontend Map View & Real-time Integration
**Files:** `ui/src/App.tsx`, `ui/src/components/MapView.tsx`, `ui/src/services/api.ts`, `ui/src/services/screenshotApi.ts`

**Key Components:**
- `App.tsx` - Main application orchestrator with state management
- `MapView` - Interactive map with SVG overlay for camera positions
- API service clients for data fetching
- Real-time polling system

**Technical Highlights:**
- Coordinate transformation (API coords → pixel positions)
- Real-time polling (1s for cameras, 2s for screenshots)
- View mode switching (Live vs Saved)
- State management with React hooks
- Event handling for map interactions

## 📊 Data Structures

### Camera Data
```typescript
interface Camera {
  SegmentID: number;        // Camera identifier (0, 1, or 2)
  Position: [number, number]; // X, Y coordinates
  Water: number;            // Water level (0.0 - 1.0)
  Light: number;            // Light intensity (0.0 - 1.0+)
  Status: string;           // "OK" | "LOWLIGHT" | "WARNING"
}
```

### Screenshot Data
```typescript
interface ScreenshotData {
  id: string;
  timestamp: string;        // ISO 8601 format
  robotId: number;
  position: [number, number];
  water: number;
  light: number;
  image: string;            // Base64 PNG data
}
```

## 🎨 Status Calculation Logic

Camera status is determined by water level and light intensity:

- **OK** (Green): Light ≥ 0.5 (128/255) AND Water ≤ 0.8
- **LOWLIGHT** (Yellow): Light ≥ 0.2 (51/255) AND < 0.5 AND Water ≤ 0.8
- **WARNING** (Red): Light < 0.2 OR Water > 0.8

## 🗺️ Map Coordinate System

The map uses a calibrated coordinate transformation system:

- **API Coordinates**: (0, 0) to (3, 2) range
- **Pixel Coordinates**: Calibrated to map image dimensions
- **Scale Factors**: 
  - X: 197.67 pixels per unit
  - Y: 288.50 pixels per unit
- **Offset**: (580, 253) pixels for origin

Formula: `Pixel = (API × Scale) + Offset`

## 🔧 Development

### Backend Development

```bash
# Camera data backend
cd ec-2025
npx tsx index.ts    # Start server (port 3000)

# Screenshot API backend
cd screenshot-api
npx tsx index.ts    # Start server (port 3001)
```

### Frontend Development

```bash
cd ui
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run preview    # Preview production build
```

### TypeScript Configuration

All modules use TypeScript with strict type checking. Configuration files:
- `ec-2025/tsconfig.json`
- `screenshot-api/tsconfig.json`
- `ui/tsconfig.json`

## 🐛 Troubleshooting

### Common Issues

**404 errors when capturing screenshots**
- Ensure screenshot API server is running on port 3001
- Check browser console for CORS errors

**404 errors when loading camera data**
- Ensure camera data backend is running on port 3000
- Verify API endpoint URLs in browser network tab

**No data appearing**
- Check browser console for API errors
- Verify all three servers are running
- Check network connectivity

**Port conflicts**
- Change ports in:
  - `ec-2025/index.ts` (default: 3000)
  - `screenshot-api/index.ts` (default: 3001)
  - `ui/vite.config.ts` (proxy configuration)

**Screenshots not saving**
- Verify `screenshot-api/screenshots.json` file permissions
- Check server logs for file system errors
- Ensure sufficient disk space

### Debug Mode

Enable verbose logging by checking server console output. All servers log:
- Request/response details
- File operations
- Error messages with stack traces

## 📝 License

MIT

## 👥 Team Presentation Structure

For competition presentations, the codebase is organized into 4 logical modules:

1. **Backend Simulation Engine** - Data generation and physics simulation
2. **Backend API & Persistence** - REST API and data storage
3. **Frontend Visualization** - UI components and visualizations
4. **Frontend Integration** - Map view and real-time data flow

Each module can be demonstrated independently while showing how they integrate into the complete system.
