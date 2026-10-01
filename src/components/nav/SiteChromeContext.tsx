"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SiteWeather =
  | { status: "loading" }
  | { status: "ready"; tempC: number; mood: string }
  | { status: "unavailable" }
  | null;

export type SiteChromeState = {
  placeName: string | null;
  weather: SiteWeather;
  mapsUrl: string | null;
  /** Higher-contrast chrome over dark map phases */
  onDarkSurface: boolean;
};

type SiteChromeContextValue = SiteChromeState & {
  setChrome: (patch: Partial<SiteChromeState>) => void;
  resetChrome: () => void;
};

const DEFAULT: SiteChromeState = {
  placeName: null,
  weather: null,
  mapsUrl: null,
  onDarkSurface: false,
};

const SiteChromeContext = createContext<SiteChromeContextValue | null>(null);

export function SiteChromeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteChromeState>(DEFAULT);

  const setChrome = useCallback((patch: Partial<SiteChromeState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetChrome = useCallback(() => setState(DEFAULT), []);

  const value = useMemo(
    () => ({ ...state, setChrome, resetChrome }),
    [state, setChrome, resetChrome],
  );

  return (
    <SiteChromeContext.Provider value={value}>{children}</SiteChromeContext.Provider>
  );
}

export function useSiteChrome() {
  const ctx = useContext(SiteChromeContext);
  if (!ctx) {
    throw new Error("useSiteChrome must be used within SiteChromeProvider");
  }
  return ctx;
}
