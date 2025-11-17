#!/bin/bash
echo "Starting continuous data streaming (overwrites each second)..."
echo "Press Ctrl+C to stop..."

while true; do
  # Get current timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
  
  # Get data from API
  cameras=$(curl -s http://localhost:3000/api/json)
  
  # Create entry with simplified format (overwrite file each time)
  cat > sewer_data_100.json << EOF
{
  "timestamp": "$timestamp",
  "cameras": $cameras
}
EOF
  
  # Wait 1 second
  sleep 1
done
