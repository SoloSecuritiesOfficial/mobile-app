import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../theme/colors";

const THEME_STORAGE_KEY = "@app_theme_dark";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: (value?: boolean) => void;
  colors: typeof Colors;
}

const darkColors = {
  ...Colors,
  background: "#121212",
  surface: "#1E1E1E",
  card: "#1E1E1E",
  text: "#F5F5F5",
  textSecondary: "#AAAAAA",
  border: "#2C2C2C",
  dashboardBackground: "#121212",
  dashboardCard: "#1E1E1E",
  dashboardHeader: "#0A0A0A",
  inputBackground: "#1E1E1E",
  inputBorder: "#333333",
};

const lightColors = {
  ...Colors,
  background: "#FFFFFF",
  surface: "#F8F9FA",
  card: "#FFFFFF",
  text: "#111111",
  textSecondary: "#555555",
  border: "#E0E0E0",
  dashboardBackground: "#FFFFFF",
  dashboardCard: "#F8F9FA",
  dashboardHeader: "#111111",
  inputBackground: "#FFFFFF",
  inputBorder: "#DADADA",
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
  colors: darkColors,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== null) {
        setIsDarkMode(saved === "true");
      }
    } catch (e) {
      console.log("Failed to load theme setting:", e);
    }
  };

  const toggleTheme = async (value?: boolean) => {
    try {
      const nextValue = value !== undefined ? value : !isDarkMode;
      setIsDarkMode(nextValue);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, String(nextValue));
    } catch (e) {
      console.log("Failed to save theme setting:", e);
    }
  };

  const activeColors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors: activeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
