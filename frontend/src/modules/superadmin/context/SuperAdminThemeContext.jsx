import React, { createContext, useContext, useState, useEffect } from 'react';

const SuperAdminThemeContext = createContext();

export function SuperAdminThemeProvider({ children }) {
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('superadmin_accent') || '#6366f1'; // Default Indigo
  });

  useEffect(() => {
    localStorage.setItem('superadmin_accent', accentColor);
    document.documentElement.style.setProperty('--superadmin-accent', accentColor);
    // Generate a subtle glow version
    document.documentElement.style.setProperty('--superadmin-glow', `${accentColor}33`);
  }, [accentColor]);

  return (
    <SuperAdminThemeContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </SuperAdminThemeContext.Provider>
  );
}

export const useSuperAdminTheme = () => useContext(SuperAdminThemeContext);
