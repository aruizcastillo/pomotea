import { validMinutes } from '~/lib/timer'

export interface Preferences {
  theme: 'tea' | 'coffee'
  focusMinutes: number
  breakMinutes: number
  sound: boolean
  notifications: boolean
}

const KEY = 'pomotea.preferences.v1'
const defaults: Preferences = { theme: 'tea', focusMinutes: 25, breakMinutes: 5, sound: true, notifications: false }

export function usePreferences() {
  const available = ref(true)
  // Seed SSR from the cookie; preserve the payload during static-page hydration.
  const themeCookie = useCookie<'tea' | 'coffee'>('pomotea-theme', { default: () => 'tea', maxAge: 31_536_000, sameSite: 'lax' })
  const preferences = useState<Preferences>('preferences', () => ({ ...defaults, theme: themeCookie.value === 'coffee' ? 'coffee' : 'tea' }))

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
      if (saved && typeof saved === 'object') {
        preferences.value = {
          theme: saved.theme === 'coffee' ? 'coffee' : 'tea',
          focusMinutes: validMinutes(saved.focusMinutes) ? saved.focusMinutes : 25,
          breakMinutes: validMinutes(saved.breakMinutes) ? saved.breakMinutes : 5,
          sound: typeof saved.sound === 'boolean' ? saved.sound : true,
          notifications: saved.notifications === true,
        }
      }
      else {
        // Preserve the original Angular app's duration on the same origin.
        const legacyMinutes = Number(localStorage.getItem('pomotea.timer.focusMinutes'))
        if (validMinutes(legacyMinutes)) preferences.value.focusMinutes = legacyMinutes
      }
    }
    catch { available.value = false }
  }

  function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    preferences.value = { ...preferences.value, [key]: value }
    themeCookie.value = preferences.value.theme
    try {
      localStorage.setItem(KEY, JSON.stringify(preferences.value))
    }
    catch { available.value = false }
  }

  function sync(event: StorageEvent) {
    if (event.key === KEY) read()
  }

  onMounted(() => {
    read()
    window.addEventListener('storage', sync)
  })
  onBeforeUnmount(() => window.removeEventListener('storage', sync))

  useHead({ htmlAttrs: { 'data-theme': () => preferences.value.theme } })
  return { preferences: readonly(preferences), setPreference, available }
}
