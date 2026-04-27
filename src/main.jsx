import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { configurePlatformApiRuntime } from './lib/session';
import { webSessionConfig } from './lib/platform/web/sessionConfig';
import { webSessionStorage } from './lib/platform/web/sessionStorageAdapter';

configurePlatformApiRuntime({
  baseUrl: webSessionConfig.baseUrl,
  sessionStorage: webSessionStorage,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
