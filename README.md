# Water Sim - Sewer Camera System Dashboard

A real-time dashboard for monitoring sewer camera robots with live data visualization, map tracking, and screenshot capture capabilities.

## Project Structure

```
water-sim/
├── ec-2025/          # Backend server (Express/TypeScript) - Camera data API
│   ├── api/         # API endpoints (JSON, CSV)
│   └── index.ts     # Server entry point (Port 3000)
├── screenshot-api/   # Screenshot API server (Express/TypeScript)
│   ├── screenshots.ts  # Screenshot endpoints
│   └── index.ts     # Server entry point (Port 3001)
└── ui/              # Frontend application (React/TypeScript)
    ├── src/
    │   ├── components/  # React components
    │   ├── services/    # API services
    │   └── types/       # TypeScript types
    └── public/      # Static assets
```

## Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- Three terminal windows (one for camera data backend, one for screenshot API, one for frontend)

## Quick Start

### 1. Install Dependencies

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

### 2. Start Camera Data Backend Server

In the first terminal:

```bash
cd ec-2025
npx tsx index.ts
```

You should see:
```
============================================================
Server Ready on http://localhost:3000
============================================================
Available API endpoints:
  GET  /api/json       - Camera data (JSON)
  GET  /api/csv        - Camera data (CSV)
============================================================
```

### 3. Start Screenshot API Server

In the second terminal:

```bash
cd screenshot-api
npx tsx index.ts
```

You should see:
```
============================================================
Screenshot API Server Ready on http://localhost:3001
============================================================
Available API endpoints:
  POST /api/screenshots - Save screenshot
  GET  /api/screenshots - Get all screenshots
============================================================
Screenshot database file: screenshot-api/screenshots.json
============================================================
```

### 4. Start Frontend Development Server

In the third terminal:

```bash
cd ui
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## Features

- **Real-time Camera Monitoring**: Live data updates every second for 3 cameras
- **Interactive Map**: Visual tracking of camera positions on sewer system map
- **Camera Stream Visualization**: Animated pipe visualization showing water levels and light conditions
- **Screenshot Capture**: Save camera visualizations with metadata (position, water, light, status)
- **Historical Data**: View and browse captured screenshots in database table

## API Endpoints

### Camera Data Backend (Port 3000)

- `GET /api/json` - Get camera data as JSON
- `GET /api/csv` - Get camera data as CSV

### Screenshot API Backend (Port 3001)

- `POST /api/screenshots` - Save a screenshot
- `GET /api/screenshots` - Get all saved screenshots

### Frontend (Port 5173)

- Development server with hot reload
- Proxies `/api/screenshots` requests to screenshot API (port 3001)
- Proxies other `/api/*` requests to camera data backend (port 3000)

## Development

### Backend Scripts

```bash
# Camera data backend
cd ec-2025
npx tsx index.ts    # Start camera data server (port 3000)

# Screenshot API backend
cd screenshot-api
npx tsx index.ts    # Start screenshot API server (port 3001)
```

### Frontend Scripts

```bash
cd ui
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Data Structure

Each camera provides:
- **SegmentID**: Camera identifier (0, 1, or 2)
- **Position**: X, Y coordinates on the map
- **Water**: Water submersion level (0.0 - 1.0)
- **Light**: Light intensity (0.0 - 1.0+)
- **Status**: Camera status (OK, LOWLIGHT, WARNING)

## Troubleshooting

- **404 errors when capturing screenshots**: Make sure screenshot API server is running on port 3001
- **404 errors when loading camera data**: Make sure camera data backend is running on port 3000
- **No data**: Check browser console for API errors
- **Port conflicts**: Change ports in `ec-2025/index.ts`, `screenshot-api/index.ts`, and `ui/vite.config.ts`

## License

MIT
