/**
 * THEME PROVIDER
 * 4-level discrete intensity selector with localStorage persistence
 * Levels defined in brand-values.json (SSOT)
 *
 * CHANGELOG:
 * - March 23, 2026: Initial creation for ui-sidebar branch
 * - March 27, 2026: Replace binary toggle with continuous intensity slider
 * - March 30, 2026: Replace continuous slider with 4-level discrete selector
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import brandValues from "@/config/brand-values.json";

type Theme = "light" | "dark";

export const THEME_LEVELS: { value: number; label: string }[] = brandValues.themeIntensityLevels;

interface ThemeContextValue {
  theme: Theme;
  intensity: number;
  setIntensity: (value: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "bls-theme-intensity";
const DEFAULT_INTENSITY = 65;

// Five anchor points per CSS variable for 4-zone interpolation
// [0] = extreme dark (0), [1] = Dark preset (15), [2] = Dim preset (40),
// [3] = Soft/light baseline (60), [4] = extreme light (100)
// Zones: 0-15, 15-40, 40-60, 60-100
const ANCHORS: Record<string, { h: number; s: number; l: number }[]> = {
  background: [
    { h: 120, s: 12, l: 0 },     // 0: extreme dark
    { h: 120, s: 11, l: 4 },     // 15: Dark (near-black forest green)
    { h: 120, s: 15, l: 24 },    // 40: Dim (medium forest green)
    { h: 38,  s: 21, l: 91 },    // 60: Soft baseline (warm parchment)
    { h: 54,  s: 93, l: 100 },   // 100: extreme light (BLS warm white)
  ],
  card: [
    { h: 120, s: 20, l: 8 },
    { h: 120, s: 16, l: 13 },
    { h: 120, s: 12, l: 29 },
    { h: 38,  s: 29, l: 94.5 },
    { h: 38,  s: 0,  l: 100 },
  ],
  popover: [
    { h: 120, s: 20, l: 3 },
    { h: 120, s: 16, l: 8 },
    { h: 120, s: 12, l: 27 },
    { h: 38,  s: 29, l: 93.3 },
    { h: 38,  s: 0,  l: 100 },
  ],
  muted: [
    { h: 120, s: 15, l: 5 },
    { h: 120, s: 12, l: 10 },
    { h: 120, s: 10, l: 20 },
    { h: 39,  s: 18, l: 87.5 },
    { h: 47,  s: 34, l: 99.5 },
  ],
};

function snapToNearest(val: number): number {
  const validValues = THEME_LEVELS.map(l => l.value);
  let closest = validValues[0];
  let minDist = Math.abs(val - closest);
  for (const v of validValues) {
    const dist = Math.abs(val - v);
    if (dist < minDist) { closest = v; minDist = dist; }
  }
  return closest;
}

function getInitialIntensity(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const val = parseInt(stored, 10);
      if (!isNaN(val) && val >= 0 && val <= 100) return snapToNearest(val);
    }
    // Migrate from old binary key
    const oldTheme = localStorage.getItem("theme");
    if (oldTheme === "dark") return THEME_LEVELS[0].value;
    if (oldTheme === "light") return DEFAULT_INTENSITY;
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
  // Zone 0-15:  anchors[0] -> anchors[1] (extreme dark -> Dark)
  // Zone 15-40: anchors[1] -> anchors[2] (Dark -> Dim)
  // Zone 40-60: anchors[2] -> anchors[3] (Dim -> Soft bridge)
  // Zone 60-100: anchors[3] -> anchors[4] (Soft -> extreme light)
  let anchorA: number;
  let anchorB: number;
  let t: number;

  if (intensity <= 15) {
    anchorA = 0;
    anchorB = 1;
    t = intensity / 15;
  } else if (intensity <= 40) {
    anchorA = 1;
    anchorB = 2;
    t = (intensity - 15) / 25;
  } else if (intensity <= 60) {
    anchorA = 2;
    anchorB = 3;
    t = (intensity - 40) / 20;
  } else {
    anchorA = 3;
    anchorB = 4;
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
