import React, { createContext, useContext, useState, useEffect } from 'react';

const SuperAdminThemeContext = createContext();

export function SuperAdminThemeProvider({ children }) {
  const accentColor = '#ff7a00'; // Static RMS Orange

  useEffect(() => {
    document.documentElement.style.setProperty('--superadmin-accent', accentColor);
    document.documentElement.style.setProperty('--superadmin-glow', `${accentColor}33`);
  }, []);

  return (
    <SuperAdminThemeContext.Provider value={{ accentColor }}>
      {children}
    </SuperAdminThemeContext.Provider>
  );
}

export const useSuperAdminTheme = () => useContext(SuperAdminThemeContext);
