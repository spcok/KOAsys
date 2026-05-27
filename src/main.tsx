import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { queryClient } from './lib/db';
import { QueryClientProvider } from '@tanstack/react-query';

// Force an explicit health check of the connection on boot
const initApp = async () => {
  console.log('[Boot] Initializing ElectricSQL Sync...');
  // Here we would trigger the SyncEngine connection logic
};

initApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);