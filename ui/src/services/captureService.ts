import html2canvas from 'html2canvas';
import type { Camera } from '../types/camera';

export interface CapturedRecord {
  id: string;
  timestamp: string;
  pngDataUrl: string;
  cameras: Camera[];
}

const STORAGE_KEY = 'sewer_camera_captures';

/**
 * Captures the current visualization as PNG and saves it with camera data
 */
export async function captureVisualization(
  mapElement: HTMLElement,
  cameras: Camera[]
): Promise<CapturedRecord> {
  // Capture the map visualization as PNG
  const canvas = await html2canvas(mapElement, {
    backgroundColor: null,
    scale: 1,
    logging: false,
  });
  
  const pngDataUrl = canvas.toDataURL('image/png');
  
  // Create capture record
  const record: CapturedRecord = {
    id: `capture_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date().toISOString(),
    pngDataUrl,
    cameras: JSON.parse(JSON.stringify(cameras)), // Deep copy
  };
  
  // Save to localStorage
  const existingRecords = getAllCaptures();
  existingRecords.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingRecords));
  
  return record;
}

/**
 * Get all captured records from storage
 */
export function getAllCaptures(): CapturedRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading captures from storage:', error);
    return [];
  }
}

/**
 * Delete a capture record by ID
 */
export function deleteCapture(id: string): void {
  const records = getAllCaptures();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Clear all captures
 */
export function clearAllCaptures(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('All saved captures have been cleared.');
}

/**
 * Get the count of saved captures
 */
export function getCaptureCount(): number {
  return getAllCaptures().length;
}

/**
 * Export captures as JSON file
 */
export function exportCaptures(): void {
  const records = getAllCaptures();
  const dataStr = JSON.stringify(records, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sewer_captures_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

