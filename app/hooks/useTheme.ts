'use client';

import { useSyncExternalStore } from "react";
import { getStoredTheme, setStoredTheme } from "../lib/storage";
import { ThemeName } from "../types";

const THEMES: ThemeName[] = ["dark", "light", "matrix", "dracula", "cyberpunk", "nord"];

let themeListeners: Array<() => void> = [];

function emitThemeChange() {
  themeListeners.forEach(listener => listener());
}

function subscribeToTheme(listener: () => void) {
  themeListeners.push(listener);
  return () => {
    themeListeners = themeListeners.filter(l => l !== listener);
  };
}

export function useTheme() {
  const theme: ThemeName = useSyncExternalStore(
    subscribeToTheme,
    () => getStoredTheme(),
    (): ThemeName => "dark"
  );

  const changeTheme = (newTheme: ThemeName) => {
    setStoredTheme(newTheme);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
    emitThemeChange();
  };

  const cycleTheme = (): ThemeName => {
    const currentIndex = THEMES.indexOf(theme);
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
    changeTheme(nextTheme);
    return nextTheme;
  };

  return {
    theme,
    changeTheme,
    cycleTheme,
    themes: THEMES,
    mounted: true,
  };
}
