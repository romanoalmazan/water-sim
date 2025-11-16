# Sewer Camera Data Collector

A data collection utility for streaming and saving data from the EC-2025 Sewer Camera System API.

## Features

- Collect real-time sewer camera data from the EC-2025 backend
- Save data to JSON files with timestamps
- Stream data for specified durations (e.g., 100 entries over 100 seconds)
- Clean, structured data output format

## Prerequisites

- EC-2025 backend server running on `http://localhost:3000`
- Bash shell (Linux/macOS/WSL)
- `curl` and `jq` installed

## Usage

### Basic Data Collection

Collect 100 data entries over 100 seconds:
```bash
./collect_data.sh
```

### Manual Data Streaming

Stream data in real-time:
```bash
# JSON format with pretty printing
watch -n 1 'curl -s http://localhost:3000/api/json | jq .'

# CSV format
watch -n 1 'curl -s http://localhost:3000/api/csv'
```

### Data Collection Loop

Continuous data collection:
```bash
while true; do
  echo "$(date): $(curl -s http://localhost:3000/api/json)" >> continuous_data.log
  sleep 1
done
```

## Data Format

Each entry contains camera data with:
- **Position**: [X, Y] coordinates
- **SegmentID**: Camera identifier (0, 1, 2)
- **Water**: Submersion percentage (0.0 to 1.0)
- **Light**: Light levels (normalized 0-1)
- **Status**: Camera status ("OK", "LOWLIGHT", "WARNING")

## Files

- `collect_data.sh` - Main data collection script
- `sewer_data_100_entries.json` - Sample collected data
- `package.json` - Project configuration

## Requirements

Make sure the EC-2025 backend is running before starting data collection:

```bash
cd /path/to/ec-2025
node index.js
```

The backend should be accessible at `http://localhost:3000/api/json`

## Example Output

```json
{
  "metadata": {
    "totalEntries": 100,
    "collectionStartTime": "2025-11-16T20:44:17.618Z",
    "durationSeconds": 100
  },
  "entries": [
    {
      "entry": 1,
      "timestamp": "2025-11-16T20:44:17.630Z",
      "cameras": [
        {
          "Position": [0, 0.294],
          "SegmentID": 0,
          "Water": 0.5,
          "Light": 1.007,
          "Status": "OK"
        }
      ]
    }
  ]
}
```
