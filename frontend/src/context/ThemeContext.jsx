import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('roadguard_theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'outdoor-mode');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'outdoor') {
      root.classList.add('outdoor-mode');
    }
    localStorage.setItem('roadguard_theme', theme);
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
