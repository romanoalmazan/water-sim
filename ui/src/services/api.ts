import type { Camera } from '../types/camera';

// Read from static JSON file
const JSON_FILE_URL = '/camera-data.json';

export async function fetchCameraData(): Promise<Camera[]> {
  const response = await fetch(JSON_FILE_URL);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data: Camera[] = await response.json();
  return data;
}
