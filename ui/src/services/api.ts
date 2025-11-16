import type { Camera } from '../types/camera';

const API_BASE_URL = '/api/json';

export async function fetchCameraData(): Promise<Camera[]> {
  try {
    console.log('Fetching from:', API_BASE_URL);
    const response = await fetch(API_BASE_URL);
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Camera[] = await response.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching camera data:', error);
    throw error;
  }
}

