import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Theme } from '../types';

interface ThemeContextType extends Theme {
  toggleMode: () => void;
  setMode: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('xstore_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setMode = (newMode: 'light' | 'dark') => {
    setModeState(newMode);
    localStorage.setItem('xstore_theme', newMode);
    
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    setMode(mode);
  }, []);

  const value: ThemeContextType = {
    mode,
    toggleMode,
    setMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};