#!/bin/bash
echo "Starting data collection for 100 seconds..."
echo "[" > sewer_data_100.json

for i in {1..100}; do
  echo "Collecting entry $i/100..."
  
  # Get current timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
  
  # Get data from API
  data=$(curl -s http://localhost:3000/api/json)
  
  # Create entry with timestamp
  entry="{\"timestamp\":\"$timestamp\",\"entry\":$i,\"data\":$data}"
  
  # Add to file
  echo "  $entry" >> sewer_data_100.json
  
  # Add comma if not last entry
  if [ $i -lt 100 ]; then
    echo "," >> sewer_data_100.json
  fi
  
  # Wait 1 second
  sleep 1
done

echo "]" >> sewer_data_100.json
echo "Data collection complete! Saved to sewer_data_100.json"
