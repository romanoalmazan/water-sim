import type { ScreenshotData, ScreenshotPayload } from '../types/screenshot';

const API_BASE_URL = '/api/screenshots';

export async function saveScreenshot(payload: ScreenshotPayload): Promise<{ success: boolean; id: string }> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving screenshot:', error);
    throw error;
  }
}

export async function getScreenshots(): Promise<ScreenshotData[]> {
  try {
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    throw error;
  }
}

