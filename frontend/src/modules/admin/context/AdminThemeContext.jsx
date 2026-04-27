import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AdminThemeContext = createContext();

export const AdminThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#2C2C2C');
  const [borderRadius, setBorderRadius] = useState('2rem');
  const [sidebarStyle, setSidebarStyle] = useState('solid');
  const [fontFamily, setFontFamily] = useState('Outfit');
  const [isLoading, setIsLoading] = useState(true);

  const initialLoadDone = useRef(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // 1. Initial Fetch from DB
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const token = localStorage.getItem('admin_access');
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        const res = await fetch(`${API_URL}/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (data.theme) {
          const { mode, primaryColor, borderRadius, sidebarStyle, fontFamily } = data.theme;
          if (mode) setThemeMode(mode);
          if (primaryColor) setPrimaryColor(primaryColor);
          if (borderRadius) setBorderRadius(borderRadius);
          if (sidebarStyle) setSidebarStyle(sidebarStyle);
          if (fontFamily) setFontFamily(fontFamily);
        }
      } catch (error) {
        console.error('Failed to fetch theme from DB:', error);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
            initialLoadDone.current = true;
        }, 500);
      }
    };
    fetchTheme();
  }, []);

  // 2. Apply & Save to DB
  useEffect(() => {
    if (isLoading) return;

    // Apply styles to document
    document.documentElement.style.setProperty('--admin-primary', primaryColor);
    document.documentElement.style.setProperty('--primary-color', primaryColor);

    // Save to DB
    if (initialLoadDone.current) {
      const saveTheme = async () => {
        try {
          const token = localStorage.getItem('admin_access');
          if (!token) return;
          
          await fetch(`${API_URL}/admin/update-theme`, {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              mode: themeMode,
              primaryColor,
              borderRadius,
              sidebarStyle,
              fontFamily
            })
          });
          console.log('Theme saved to DB');
        } catch (error) {
          console.error('Failed to save theme to DB:', error);
        }
      };

      const timeoutId = setTimeout(saveTheme, 1000); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [themeMode, primaryColor, borderRadius, sidebarStyle, fontFamily, isLoading]);

  return (
    <AdminThemeContext.Provider value={{ 
      themeMode, setThemeMode, 
      primaryColor, setPrimaryColor, 
      borderRadius, setBorderRadius,
      sidebarStyle, setSidebarStyle,
      fontFamily, setFontFamily,
      isLoading
    }}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => useContext(AdminThemeContext);
