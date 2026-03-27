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

// Four anchor points per CSS variable for continuous interpolation
// [0] = darkest (intensity 0), [1] = mid-dark baseline (40),
// [2] = mid-light baseline (60), [3] = brightest (100)
const ANCHORS: Record<string, { h: number; s: number; l: number }[]> = {
  background: [
    { h: 120, s: 12, l: 0 },   // 0: darkest
    { h: 120, s: 8,  l: 11 },  // 40: dark baseline (low sat near bridge)
    { h: 50,  s: 5,  l: 96 },  // 60: light baseline (near-neutral)
    { h: 50,  s: 100, l: 99 }, // 100: brightest (full BLS warm white)
  ],
  card: [
    { h: 120, s: 20, l: 8 },
    { h: 120, s: 8,  l: 20 },
    { h: 0,   s: 0,  l: 98 },
    { h: 0,   s: 0,  l: 100 },
  ],
  popover: [
    { h: 120, s: 20, l: 3 },
    { h: 120, s: 8,  l: 15 },
    { h: 0,   s: 0,  l: 98 },
    { h: 0,   s: 0,  l: 100 },
  ],
  muted: [
    { h: 120, s: 15, l: 5 },
    { h: 120, s: 6,  l: 17 },
    { h: 43,  s: 5,  l: 95 },
    { h: 43,  s: 41, l: 97 },
  ],
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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function applyIntensity(intensity: number): void {
  const root = document.documentElement;

  // Toggle .dark class at midpoint
  if (intensity < 50) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Determine which two anchors to interpolate between
  // Zone 0-40: anchors[0] -> anchors[1]
  // Zone 40-60: anchors[1] -> anchors[2] (bridge zone)
  // Zone 60-100: anchors[2] -> anchors[3]
  let anchorA: number;
  let anchorB: number;
  let t: number;

  if (intensity <= 40) {
    anchorA = 0;
    anchorB = 1;
    t = intensity / 40;
  } else if (intensity <= 60) {
    anchorA = 1;
    anchorB = 2;
    t = (intensity - 40) / 20;
  } else {
    anchorA = 2;
    anchorB = 3;
    t = (intensity - 60) / 40;
  }

  for (const [key, anchors] of Object.entries(ANCHORS)) {
    const a = anchors[anchorA];
    const b = anchors[anchorB];
    const h = Math.round(lerp(a.h, b.h, t));
    const s = clamp(Math.round(lerp(a.s, b.s, t)), 0, 100);
    const l = clamp(Math.round(lerp(a.l, b.l, t) * 10) / 10, 0, 100);
    root.style.setProperty(`--${key}`, `${h} ${s}% ${l}%`);
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
