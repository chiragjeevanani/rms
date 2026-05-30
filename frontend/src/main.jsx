import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for Firebase Cloud Messaging
const isElectron = typeof window !== 'undefined' && !!window.api;
if ('serviceWorker' in navigator && !isElectron && window.location.protocol !== 'file:') {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('FCM Service Worker registered with scope:', registration.scope);
    })
    .catch((err) => {
      console.error('FCM Service Worker registration failed:', err);
    });
}



