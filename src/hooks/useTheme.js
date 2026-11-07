import { useState, useEffect } from 'react'

/**
 * useTheme — manages light / dark / system theme.
 *
 * Writes `data-theme` on <html> and persists to localStorage.
 * The anti-flash script in index.html sets the initial value
 * before React hydrates, so there's no FOUC.
 *
 * Returns [theme, setTheme, isDark]
 * theme: 'light' | 'dark' | 'system'
 */
export function useTheme() {
  const [theme, _setTheme] = useState(
    () => localStorage.getItem('ut-theme') ?? 'system'
  )

  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  /* Also react to system preference changes when mode is 'system' */
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => {
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [theme])

  function setTheme(next) {
    localStorage.setItem('ut-theme', next)
    _setTheme(next)
  }

  return [theme, setTheme, isDark]
}

/** Convenience toggle: cycles light → dark → system → light */
export function useThemeToggle() {
  const [theme, setTheme, isDark] = useTheme()
  function toggle() {
    setTheme(isDark ? 'light' : 'dark')
  }
  return [isDark, toggle, theme, setTheme]
}
