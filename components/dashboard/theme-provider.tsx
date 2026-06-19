"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [theme, setThemeState] = useState<Theme>("light")

  // Apply theme to document element
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === "undefined") return
    const root = document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [])

  // Initial theme load
  useEffect(() => {
    // 1. Check Local Storage
    const localTheme = localStorage.getItem("growwave-theme") as Theme | null
    if (localTheme === "light" || localTheme === "dark") {
      setThemeState(localTheme)
      applyTheme(localTheme)
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      const systemTheme = prefersDark ? "dark" : "light"
      setThemeState(systemTheme)
      applyTheme(systemTheme)
    }
  }, [applyTheme])

  // Sync theme from Database when user session becomes available
  useEffect(() => {
    if (session?.user?.email) {
      // Fetch user profile settings
      fetch("/api/settings")
        .then((res) => {
          if (res.ok) return res.json()
        })
        .then((data) => {
          const dbTheme = data?.user?.theme
          if (dbTheme === "light" || dbTheme === "dark") {
            setThemeState(dbTheme)
            applyTheme(dbTheme)
            localStorage.setItem("growwave-theme", dbTheme)
          }
        })
        .catch((err) => console.error("Error loading theme from DB:", err))
    }
  }, [session, applyTheme])

  // Change theme handler
  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme)
      applyTheme(newTheme)
      localStorage.setItem("growwave-theme", newTheme)

      // If user is authenticated, save to database
      if (session?.user?.email) {
        try {
          await fetch("/api/settings", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user: {
                theme: newTheme,
              },
            }),
          })
        } catch (err) {
          console.error("Failed to save theme setting to DB:", err)
        }
      }
    },
    [session, applyTheme]
  )

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
