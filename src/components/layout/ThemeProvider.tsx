/**
 * THEME PROVIDER
 * Continuous intensity slider (0-100) with localStorage persistence
 * 0 = darkest dark, 50 = default midpoint, 100 = brightest light
 *
 * CHANGELOG:
 * - March 23, 2026: Initial creation for ui-sidebar branch
 * - March 27, 2026: Replace binary toggle with continuous intensity slider
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  intensity: number;
  setIntensity: (value: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "bls-theme-intensity";
const DEFAULT_INTENSITY = 50;

// CSS variable baselines (HSL values from index.css)
// Dark mode baselines (intensity 0-49)
const DARK_DEFAULTS = {
  background: { h: 120, s: 12, l: 11 },
  card:       { h: 120, s: 20, l: 20 },
  popover:    { h: 120, s: 20, l: 15 },
  muted:      { h: 120, s: 15, l: 17 },
};

// Light mode baselines (intensity 50-100)
const LIGHT_DEFAULTS = {
  background: { h: 50, s: 100, l: 99 },
  card:       { h: 0,  s: 0,   l: 100 },
  popover:    { h: 0,  s: 0,   l: 100 },
  muted:      { h: 43, s: 41,  l: 97 },
};

function getInitialIntensity(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const val = parseInt(stored, 10);
      if (!isNaN(val) && val >= 0 && val <= 100) return val;
    }
    // Migrate from old binary key
    const oldTheme = localStorage.getItem("theme");
    if (oldTheme === "dark") return 25;
    if (oldTheme === "light") return 50;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_INTENSITY;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function applyIntensity(intensity: number): void {
  const root = document.documentElement;

  if (intensity < 50) {
    // DARK MODE: intensity 0 = darkest, 49 = near-baseline dark
    root.classList.add("dark");

    // t=0 at intensity 0 (darkest shift), t=1 at intensity 49 (baseline)
    const t = intensity / 49;
    // At t=0, shift lightness down by 12; at t=1, shift is 0
    const shift = -12 * (1 - t);

    for (const [key, base] of Object.entries(DARK_DEFAULTS)) {
      const l = clamp(base.l + shift, 0, 100);
      root.style.setProperty(`--${key}`, `${base.h} ${base.s}% ${l}%`);
    }
  } else {
    // LIGHT MODE: intensity 50 = baseline light, 100 = brightest
    root.classList.remove("dark");

    // t=0 at intensity 50 (baseline), t=1 at intensity 100 (brightest shift)
    const t = (intensity - 50) / 50;
    // At t=0, shift is 0; at t=1, shift lightness up by 12 (clamped at 100)
    const shift = 12 * t;

    for (const [key, base] of Object.entries(LIGHT_DEFAULTS)) {
      const l = clamp(base.l + shift, 0, 100);
      root.style.setProperty(`--${key}`, `${base.h} ${base.s}% ${l}%`);
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [intensity, setIntensityState] = useState<number>(getInitialIntensity);

  const theme: Theme = intensity < 50 ? "dark" : "light";

  useEffect(() => {
    applyIntensity(intensity);
  }, [intensity]);

  const setIntensity = (value: number) => {
    const clamped = clamp(Math.round(value), 0, 100);
    setIntensityState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // localStorage unavailable
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, intensity, setIntensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
