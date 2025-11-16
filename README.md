# Sewer Camera System - Real-time Dashboard

A real-time frontend dashboard that streams data from the EC-2025 Sewer Camera System backend and provides a graphical interface for monitoring camera positions, water levels, lighting conditions, and system status.

## Architecture

```
┌─────────────────┐    HTTP API     ┌─────────────────┐
│                 │ ────────────► │                 │
│  Frontend       │                │  EC-2025        │
│  Dashboard      │ ◄──────────── │  Backend        │
│  (Port 8080)    │   JSON Data    │  (Port 3000)    │
└─────────────────┘                └─────────────────┘
```

## Features

### 🎯 Real-time Data Streaming
- **Automatic Updates**: Fetches data every second from the EC-2025 backend
- **Live Connection Status**: Visual indicator of backend connectivity
- **Error Handling**: Graceful handling of connection failures

### 📊 Interactive Dashboard
- **Camera Cards**: Individual cards for each camera with detailed information
- **System Overview**: Statistics panel with active camera count and last update time
- **Responsive Design**: Works on desktop and mobile devices

### 🗺️ Visual Map Representation
- **Real-time Positions**: Camera locations plotted on a canvas-based map
- **Color-coded Status**: Different colors for OK, LOWLIGHT, and WARNING states
- **Water Level Indicators**: Visual circles showing water submersion levels
- **Sewer System Layout**: Background grid and pipe representations

### 📈 Data Visualization
- **Water Level Progress Bars**: Animated bars showing percentage of submersion
- **Light Level Meters**: Visual representation of lighting conditions (0-255 scale)
- **Status Badges**: Color-coded status indicators for each camera

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- EC-2025 backend running on port 3000

### 1. Start the Backend (EC-2025)
```bash
cd /path/to/ec-2025
node index.js
# Should display: "Server Ready"
```

### 2. Start the Frontend Dashboard
```bash
cd /path/to/water-sim
npm install
npm start
# Server will start on http://localhost:8080
```

### 3. Access the Dashboard
Open your browser and navigate to:
```
http://localhost:8080
```

## API Connection

The dashboard connects to the EC-2025 backend API endpoint:
- **URL**: `http://localhost:3000/api/json`
- **Method**: GET
- **Update Frequency**: Every 1000ms (1 second)
- **Data Format**: JSON array of camera objects

### Sample Data Structure
```json
[
  {
    "Position": [1.25, 1.5],
    "SegmentID": 0,
    "Water": 0.75,
    "Light": 0.8,
    "Status": "OK"
  }
]
```

## Data Fields Explained

| Field | Description | Range/Values |
|-------|-------------|--------------|
| `Position` | [X, Y] coordinates of camera | Float array [x, y] |
| `SegmentID` | Unique identifier for camera segment | Integer (0, 1, 2...) |
| `Water` | Water submersion percentage | 0.0 - 1.0 (0% - 100%) |
| `Light` | Light level intensity | 0.0 - 1.0+ (normalized to 0-255) |
| `Status` | Camera operational status | "OK", "LOWLIGHT", "WARNING" |

## Status Indicators

### Connection Status
- 🟢 **Green Dot**: Connected to backend
- 🔴 **Red Dot**: Backend connection lost

### Camera Status Colors
- 🟢 **Green**: OK - Normal operation
- 🟡 **Yellow**: LOWLIGHT - Low lighting conditions
- 🔴 **Red**: WARNING - Critical issues detected

## Troubleshooting

### Common Issues

**1. Frontend shows "Backend Connection" as red:**
- Ensure EC-2025 backend is running on port 3000
- Check that `curl http://localhost:3000/api/json` returns data
- Verify no firewall is blocking the connection

**2. Dashboard loads but no data appears:**
- Check browser console for JavaScript errors
- Verify the backend API returns properly formatted JSON
- Ensure CORS is not blocking the requests

### Debug Commands

Test backend connectivity:
```bash
curl -s http://localhost:3000/api/json | jq .
```

Check frontend health:
```bash
curl http://localhost:8080/health
```
<<<<<<< HEAD
test test

                 .   .   .   .   .   .   .
              .   .  /0\  .  /0\  .  /0\   .
           . . . . . . . . . . . . . . . . . .
        ooooooooooooooooooooooooooooooooooooooo
      o0ooooooooooooooooooooooooooooooooooooooo0o
    o00oooooooooooooooooooooooooooooooooooooooo00o
   o000oooooooooooooooooooooooooooooooooooooooo000o
  o0000oooooooooooooooooooooooooooooooooooooooo0000o
  o0000ooooooooooooooooooo0oooooooooooooooooooo0000o
  o0000ooooooo//////////ooo//////////ooooooo0000o
   o000ooooooo//////////ooo//////////ooooooo000o
    o00ooooooooooooooooooo0oooooooooooooooooo00o
      o0ooooooooo shaun is in ooooooooooooo0o
        ooooooooooooooooooooooooooooooooooooo
            oooooooooooooooooooooooooooo
                ooooooooooooooooooo
                    ooooooooooo
                        oooo
=======
>>>>>>> nick_dev
