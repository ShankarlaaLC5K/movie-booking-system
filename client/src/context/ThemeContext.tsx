import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext =
  createContext<ThemeContextType | undefined>(
    undefined
  );

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [theme, setTheme] =
    useState<Theme>(() => {
      const savedTheme =
        localStorage.getItem(
          "movie-booking-theme"
        );

      if (
        savedTheme === "light" ||
        savedTheme === "dark"
      ) {
        return savedTheme;
      }

      return window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "dark"
        : "light";
    });

  useEffect(() => {
    const root =
      document.documentElement;

    root.classList.toggle(
      "dark",
      theme === "dark"
    );

    root.style.colorScheme = theme;

    localStorage.setItem(
      "movie-booking-theme",
      theme
    );
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "dark"
        ? "light"
        : "dark"
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider"
    );
  }

  return context;
}