import React, { createContext, useContext, useState, useEffect } from 'react';

const SuperAdminThemeContext = createContext();

export function SuperAdminThemeProvider({ children }) {
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('superadmin_accent_color') || '#ff7a00';
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--superadmin-accent', accentColor);
    document.documentElement.style.setProperty('--superadmin-glow', `${accentColor}33`);
    document.documentElement.style.setProperty('--primary-color', accentColor);
    document.documentElement.style.setProperty('--admin-primary', accentColor);
    localStorage.setItem('superadmin_accent_color', accentColor);

    const debounceTimer = setTimeout(() => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${apiUrl}/superadmin/update-theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor: accentColor })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('System theme color updated in database:', accentColor);
        }
      })
      .catch(err => console.error('Failed to sync system theme to DB:', err));
    }, 600);

    return () => clearTimeout(debounceTimer);
  }, [accentColor]);

  return (
    <SuperAdminThemeContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </SuperAdminThemeContext.Provider>
  );
}

export const useSuperAdminTheme = () => useContext(SuperAdminThemeContext);
