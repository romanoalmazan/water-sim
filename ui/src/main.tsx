import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { clearAllCaptures, getAllCaptures, getCaptureCount } from './services/captureService'
import './index.css'

// Expose clear function to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).clearSavedCaptures = () => {
    const count = getCaptureCount();
    clearAllCaptures();
    console.log(`Cleared ${count} saved capture(s).`);
    return `Cleared ${count} saved capture(s).`;
  };
  
  (window as any).getSavedCapturesCount = () => {
    const count = getCaptureCount();
    console.log(`There are ${count} saved capture(s).`);
    return count;
  };
  
  (window as any).getAllSavedCaptures = () => {
    return getAllCaptures();
  };
  
  console.log('Utility functions available:');
  console.log('  - clearSavedCaptures() - Clear all saved captures');
  console.log('  - getSavedCapturesCount() - Get count of saved captures');
  console.log('  - getAllSavedCaptures() - Get all saved captures');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

