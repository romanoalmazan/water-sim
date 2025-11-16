# Camera Dashboard

A real-time React TypeScript dashboard that displays live camera data from the sewer camera system API.

## Features

- Real-time data updates every second
- Displays data for all 3 cameras (SegmentID 0, 1, 2)
- Shows Position, Water Submersion %, Light Level, and Status for each camera
- Clean, simple UI with card-based layout

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- The backend server running on `http://localhost:3000`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure the backend server is running:
```bash
cd ../ec-2025
npm install
npm start
# Server should be running on http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173` (or the port shown in the terminal).

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
ui/
├── src/
│   ├── components/
│   │   └── CameraCard.tsx    # Individual camera display component
│   ├── services/
│   │   └── api.ts             # API fetching logic
│   ├── types/
│   │   └── camera.ts          # TypeScript interfaces
│   ├── App.tsx                # Main application component
│   ├── App.css                # Application styles
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration
```

## How It Works

The application polls the `/api/json` endpoint every second using `setInterval` in a React `useEffect` hook. The data is fetched, parsed, and displayed in real-time for all three cameras. Each camera is displayed in its own card showing:

- Segment ID
- X, Y Position coordinates
- Water Submersion percentage
- Light Level (0-255)
- Camera Status (OK, LOWLIGHT, WARNING)

The UI automatically updates every second with the latest data from the backend.

