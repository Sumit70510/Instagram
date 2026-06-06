import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'instaGramThemeMode';

export const ThemeContext = createContext({
  themeMode: 'light',
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'));

  const value = useMemo(
    () => ({ themeMode, setThemeMode, toggleTheme }),
    [themeMode],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export default function useTheme() {
  return useContext(ThemeContext);
}