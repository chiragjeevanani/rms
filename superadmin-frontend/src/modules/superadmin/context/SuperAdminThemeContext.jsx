import React, { createContext, useContext, useEffect } from 'react';

const SuperAdminThemeContext = createContext();

export function SuperAdminThemeProvider({ children }) {
  const accentColor = '#EF4444'; // Static Passion Red
  const setAccentColor = () => {}; // No-op to prevent breaking changes in consumer files

  useEffect(() => {
    document.documentElement.style.setProperty('--superadmin-accent', accentColor);
    document.documentElement.style.setProperty('--superadmin-glow', `${accentColor}33`);
    document.documentElement.style.setProperty('--primary-color', accentColor);
    document.documentElement.style.setProperty('--admin-primary', accentColor);
  }, []);

  return (
    <SuperAdminThemeContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </SuperAdminThemeContext.Provider>
  );
}

export const useSuperAdminTheme = () => useContext(SuperAdminThemeContext);
