# Camera Dashboard

A React TypeScript dashboard that displays camera data from a static JSON file.

## Features

- Displays data for all 3 cameras (SegmentID 0, 1, 2)
- Shows Position, Water Submersion %, Light Level, and Status for each camera
- Clean, simple UI with card-based layout
- Screenshot capture and viewing functionality

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173` (or the port shown in the terminal).

## Data Source

Camera data is loaded from `/camera-data.json` in the public folder. Update this file to change the displayed data.

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

The application loads camera data from the static JSON file in the public folder. The data is fetched, parsed, and displayed for all three cameras. Each camera is displayed in its own card showing:

- Segment ID
- X, Y Position coordinates
- Water Submersion percentage
- Light Level
- Camera Status (OK, LOWLIGHT, WARNING)

The UI polls the JSON file every second to check for updates.

