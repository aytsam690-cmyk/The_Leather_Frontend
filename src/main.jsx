import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Hide the inline loading screen once React has painted
requestAnimationFrame(() => {
  const loader = document.getElementById('root-loader');
  if (loader) {
    loader.classList.add('hide');
    setTimeout(() => loader.remove(), 400);
  }
});
