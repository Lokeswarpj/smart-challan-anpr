import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('roadguard_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'outdoor-mode');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'outdoor') {
      root.classList.add('outdoor-mode');
    }
    try {
      localStorage.setItem('roadguard_theme', theme);
    } catch {}
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleOutdoor = () => {
    setThemeState((prev) => (prev === 'outdoor' ? 'light' : 'outdoor'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleOutdoor, isOutdoor: theme === 'outdoor' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

