import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Always default to false (disable dark mode)
  const isDarkMode = false;

  useEffect(() => {
    // Forcefully remove dark class and cleanup storage
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  const toggleTheme = () => {
    // No-op to prevent errors in components destructing toggleTheme
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);



