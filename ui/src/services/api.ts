import type { Camera } from '../types/camera';

// Read from data-collector-app sewer_data_100.json
const JSON_FILE_URL = '/sewer_data_100.json';

interface SewerDataResponse {
  timestamp: string;
  cameras: string; // JSON string that needs to be parsed
}

export async function fetchCameraData(): Promise<Camera[]> {
  // Add cache-busting query parameter to ensure fresh data every second
  const cacheBuster = `?t=${Date.now()}`;
  const response = await fetch(JSON_FILE_URL + cacheBuster, {
    cache: 'no-store', // Prevent browser caching
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Parse the response which has timestamp and cameras (as JSON string)
  const data: SewerDataResponse = await response.json();
  
  // Parse the cameras JSON string into an array
  const cameras: Camera[] = JSON.parse(data.cameras);
  
  return cameras;
}
