import type { Camera } from '../types/camera';

const API_BASE_URL = '/api/json';

export async function fetchCameraData(): Promise<Camera[]> {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Camera[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching camera data:', error);
    throw error;
  }
}

