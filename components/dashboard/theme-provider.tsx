"use client"

import { createContext, useCallback, useContext, useEffect, useMemo } from "react"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: Theme = "light"

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark")
    localStorage.setItem("growwave-theme", "light")
  }, [])

  const toggle = useCallback(() => {
    // Theme is globally locked to light mode. Toggling is disabled.
  }, [])

  const setTheme = useCallback((t: Theme) => {
    // Theme is globally locked to light mode. Custom themes are disabled.
  }, [])

  const value = useMemo(() => ({ theme, toggle, setTheme }), [toggle, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
