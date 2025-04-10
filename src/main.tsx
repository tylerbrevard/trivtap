
import { createRoot } from 'react-dom/client';
import App from './App.tsx'
import './index.css'
import { Workbox } from 'workbox-window';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  const wb = new Workbox('/service-worker.js');
  
  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      if (confirm('New app version available! Reload to update?')) {
        window.location.reload();
      }
    }
  });
  
  wb.register();
}

createRoot(document.getElementById("root")!).render(<App />);
