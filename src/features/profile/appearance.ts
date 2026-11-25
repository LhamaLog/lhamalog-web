export const appearanceStorageKeys = {
  theme: 'lhamalog.theme',
  reduceMotion: 'lhamalog.reduceMotion',
  underlineLinks: 'lhamalog.underlineLinks',
  contrast: 'lhamalog.contrast',
} as const

export const themeChoices = ['light', 'dark', 'system'] as const

export type ThemeChoice = (typeof themeChoices)[number]

export type Appearance = {
  theme: ThemeChoice
  reduceMotion: boolean
  underlineLinks: boolean
  contrast: boolean
}

export type AppearanceStore = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

const appearanceAttributes = ['data-theme', 'data-reduce-motion', 'data-underline-links', 'data-contrast'] as const

export type AppearanceRoot = {
  setAttribute: (name: string, value: string) => void
  removeAttribute: (name: string) => void
}

const listeners = new Set<() => void>()

export const defaultAppearance: Appearance = {
  theme: 'system',
  reduceMotion: false,
  underlineLinks: false,
  contrast: false,
}

function browserStore(): AppearanceStore {
  const storage = globalThis.localStorage
  if (!storage) throw new Error('localStorage is unavailable')
  return storage
}

function themeOf(value: string | null): ThemeChoice {
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'system'
}

function flagOf(value: string | null): boolean {
  return value === 'true'
}

export function readAppearance(store: AppearanceStore = browserStore()): Appearance {
  return {
    theme: themeOf(store.getItem(appearanceStorageKeys.theme)),
    reduceMotion: flagOf(store.getItem(appearanceStorageKeys.reduceMotion)),
    underlineLinks: flagOf(store.getItem(appearanceStorageKeys.underlineLinks)),
    contrast: flagOf(store.getItem(appearanceStorageKeys.contrast)),
  }
}

export function writeAppearance(appearance: Appearance, store: AppearanceStore = browserStore()) {
  store.setItem(appearanceStorageKeys.theme, themeOf(appearance.theme))
  store.setItem(appearanceStorageKeys.reduceMotion, appearance.reduceMotion ? 'true' : 'false')
  store.setItem(appearanceStorageKeys.underlineLinks, appearance.underlineLinks ? 'true' : 'false')
  store.setItem(appearanceStorageKeys.contrast, appearance.contrast ? 'true' : 'false')
  for (const listener of listeners) listener()
}

export function subscribeAppearance(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function resolvedTheme(theme: string, prefersDark: boolean): 'light' | 'dark' {
  if (theme === 'dark') return 'dark'
  if (theme === 'light') return 'light'
  return prefersDark ? 'dark' : 'light'
}

function setFlag(root: AppearanceRoot, name: string, enabled: boolean) {
  if (enabled) root.setAttribute(name, 'true')
  else root.removeAttribute(name)
}

export function applyAppearance(root: AppearanceRoot, appearance: Appearance, prefersDark: boolean) {
  root.setAttribute('data-theme', resolvedTheme(appearance.theme, prefersDark))
  setFlag(root, 'data-reduce-motion', appearance.reduceMotion)
  setFlag(root, 'data-underline-links', appearance.underlineLinks)
  setFlag(root, 'data-contrast', appearance.contrast)
}

export function clearAppearance(root: AppearanceRoot) {
  for (const name of appearanceAttributes) root.removeAttribute(name)
}
