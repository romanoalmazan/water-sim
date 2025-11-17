# Sewer Camera Data Collector

A simple bash script to collect real-time data from the Sewer Camera System API and save it to JSON files.

## Prerequisites

- Backend server running on `localhost:3000`
- `curl` command available
- `jq` command available (for JSON formatting)

## Usage

1. Ensure the backend server is running:
   ```bash
   cd ../ec-2025
   npm start
   ```

2. Run the data collector:
   ```bash
   ./collect_data.sh
   ```

The script will:
- Connect to the API at `http://localhost:3000/api/json`
- Collect data every second continuously
- Save data to `sewer_data_100.json` (overwrites each time)
- Display timestamp with each collection

## Output Format

The JSON file contains:
```json
{
  "timestamp": "2025-01-XX XX:XX:XX",
  "cameras": [
    {
      "Position": 123.45,
      "SegmentID": 1,
      "Water": 0.67,
      "Light": 0.89,
      "Status": "OK"
    }
  ]
}
```

## Sample Data

- `sewer_data_100.json` - Most recent data collected
- `sewer_data_100_entries.json` - Sample data from previous collection

## Stopping the Collector

Press `Ctrl+C` to stop the data collection script.