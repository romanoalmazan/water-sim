/**
 * Calculate camera status based on Water and Light values
 * Matches the logic used in CameraStreamModal
 * 
 * Status rules:
 * - OK: Light >= 0.5 (good visibility)
 * - LOWLIGHT: Light >= 0.2 and < 0.5 (reduced visibility)
 * - WARNING: Light < 0.2 OR Water > 0.8 (critical conditions)
 */
export function calculateStatus(water: number, light: number): {
  status: string;
  color: string;
  isWarning: boolean;
} {
  // Convert light to 0-255 scale for comparison
  const light255 = light * 255;
  
  // Critical: Very low light OR very high water
  if (light255 < 51 || water > 0.8) { // Light < 0.2 (51/255) OR Water > 80%
    return {
      status: 'WARNING',
      color: '#ef4444', // Red
      isWarning: true
    };
  }
  
  // Low light condition
  if (light255 < 128) { // Light < 0.5 (128/255)
    return {
      status: 'LOWLIGHT',
      color: '#fbbf24', // Yellow
      isWarning: false
    };
  }
  
  // OK condition
  return {
    status: 'OK',
    color: '#4ade80', // Green
    isWarning: false
  };
}

