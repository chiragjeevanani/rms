import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SystemThemeContext = createContext();

export const SystemThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#ff7a00'); // POS Default
  const [borderRadius, setBorderRadius] = useState('0.5rem');
  const [fontFamily, setFontFamily] = useState('Outfit');
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'https://rmsapi.cloudedata.in/api';

  const fetchSystemTheme = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/public-info`);
      const data = await res.json();
      
      if (data.theme) {
        const { mode, primaryColor, borderRadius, fontFamily } = data.theme;
        if (mode) setThemeMode(mode);
        if (primaryColor) setPrimaryColor(primaryColor);
        if (borderRadius) setBorderRadius(borderRadius);
        if (fontFamily) setFontFamily(fontFamily);
      }
    } catch (error) {
      console.error('Failed to fetch system theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemTheme();

    // Connect to Socket.IO for real-time theme updates
    const socket = io(API_URL.replace('/api', ''));

    socket.on('themeUpdated', (newTheme) => {
      console.log('Received real-time theme update:', newTheme);
      if (newTheme) {
        const { mode, primaryColor, borderRadius, fontFamily } = newTheme;
        if (mode) setThemeMode(mode);
        if (primaryColor) setPrimaryColor(primaryColor);
        if (borderRadius) setBorderRadius(borderRadius);
        if (fontFamily) setFontFamily(fontFamily);
      }
    });

    // Refresh theme every 5 minutes to stay in sync
    const interval = setInterval(fetchSystemTheme, 300000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Apply styles to document
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--pos-primary', primaryColor);
    
  }, [themeMode, primaryColor, borderRadius, fontFamily, isLoading]);

  return (
    <SystemThemeContext.Provider value={{ 
      themeMode, 
      primaryColor, 
      borderRadius, 
      fontFamily, 
      isLoading,
      refreshTheme: fetchSystemTheme
    }}>
      {children}
    </SystemThemeContext.Provider>
  );
};

export const useSystemTheme = () => useContext(SystemThemeContext);
