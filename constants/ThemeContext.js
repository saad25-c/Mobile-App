import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  bg: '#F2F2F2',
  card: '#FFFFFF',
  text: '#2E2F39',
  subText: '#888',
  border: '#eee',
  header: '#5DAEB3',
  inputBg: '#F2F2F2',
};

export const darkTheme = {
  bg: '#0f0f1a',
  card: '#1e1e2e',
  text: '#f0f0f0',
  subText: '#aaa',
  border: '#2a2a3a',
  header: '#3d8a8f',
  inputBg: '#2a2a3a',
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    AsyncStorage.getItem('appTheme').then((t) => { if (t) setTheme(t); });
  }, []);

  const toggleTheme = async (val) => {
    setTheme(val);
    await AsyncStorage.setItem('appTheme', val);
  };

  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
