/**
 * Lightweight user preferences persisted on this device (localStorage).
 * Theme is applied to <html data-theme> before first paint in index.html;
 * these helpers keep that contract in one place for the Settings screen.
 */

export type Theme = 'light' | 'dark'

const THEME_KEY = 'cbs-theme'
const DEFAULT_MODEL_KEY = 'cbs-default-model'

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // storage unavailable — theme still applies for this session
  }
}

/** The model key pre-selected on the predictor. Empty string = no preference. */
export function getDefaultModel(): string {
  try {
    return localStorage.getItem(DEFAULT_MODEL_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setDefaultModel(key: string) {
  try {
    if (key) localStorage.setItem(DEFAULT_MODEL_KEY, key)
    else localStorage.removeItem(DEFAULT_MODEL_KEY)
  } catch {
    // storage unavailable — preference simply won't persist
  }
}
