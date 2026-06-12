import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './config/apiInterceptor.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

