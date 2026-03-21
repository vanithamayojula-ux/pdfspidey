import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const debugLog = (payload: Record<string, unknown>) => {
  // #region agent log
  fetch('http://127.0.0.1:7703/ingest/33bd8a87-b60f-41cb-9ea1-3de7baf2f1a8',{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain','X-Debug-Session-Id':'fb1f24'},body:JSON.stringify({sessionId:'fb1f24',...payload,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
};

window.addEventListener('error', (event) => {
  debugLog({
    runId: 'pre-fix',
    hypothesisId: 'H4',
    location: 'src/main.tsx:error-listener',
    message: 'Unhandled runtime error',
    data: { message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno },
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
  debugLog({
    runId: 'pre-fix',
    hypothesisId: 'H4',
    location: 'src/main.tsx:rejection-listener',
    message: 'Unhandled promise rejection',
    data: { reason },
  });
});

const rootEl = document.getElementById('root');
debugLog({
  runId: 'pre-fix',
  hypothesisId: 'H1',
  location: 'src/main.tsx:root-check',
  message: 'Root element lookup',
  data: { hasRoot: Boolean(rootEl), href: window.location.href },
});

createRoot(rootEl!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
