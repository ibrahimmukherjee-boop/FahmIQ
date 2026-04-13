import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import colors from "@/constants/colors";

type ColorTokens = typeof colors.light & { radius: number };

interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
  colors: ColorTokens;
}

const defaultColors: ColorTokens = { ...colors.dark, radius: colors.radius } as ColorTokens;

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleDark: () => {},
  colors: defaultColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("darkMode").then((val) => {
      if (val !== null) setIsDark(val === "true");
    });
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem("darkMode", String(next));
      return next;
    });
  }, []);

  const activeColors: ColorTokens = {
    ...(isDark ? (colors as any).dark : colors.light),
    radius: colors.radius,
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, colors: activeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
