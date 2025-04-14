import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface GlobalContextProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  loading: boolean;
  setLoading: (isLoading: boolean) => void;
  showMenu: boolean;
  toggleMenu: () => void;
}

const GlobalContext = createContext<GlobalContextProps | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(true);

  // Check system preference on component mount
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme !== null) {
      // Use saved preference if available
      setDarkMode(savedTheme === 'true');
    } else {
      // Otherwise use system preference
      setDarkMode(prefersDark);
    }
  }, []);

  // Apply dark mode class to document when darkMode changes
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <GlobalContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        loading,
        setLoading,
        showMenu,
        toggleMenu
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = (): GlobalContextProps => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};