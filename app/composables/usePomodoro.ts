import type { TimerMode, TimerState } from '~/lib/timer'
import { createTimer, formatTime, parseTimer, pauseTimer, reconcileTimer, remainingTime, startTimer, TIMER_KEY } from '~/lib/timer'

export function usePomodoro(onComplete: (state: TimerState, late: boolean) => void) {
  const state = useState<TimerState>('timer', () => createTimer())
  const now = ref(Date.now())
  const ready = ref(false)
  const storageAvailable = ref(true)
  let ticker: ReturnType<typeof setInterval> | undefined
  let completing = false
  let disposed = false

  function read() {
    try {
      return parseTimer(localStorage.getItem(TIMER_KEY))
    }
    catch {
      storageAvailable.value = false
      return null
    }
  }

  function save(value: TimerState) {
    state.value = value
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify(value))
    }
    catch { storageAvailable.value = false }
  }

  // Serialise mutations between tabs where Web Locks is available. The storage
  // event is the fallback; no per-second writes or worker timers are necessary.
  async function update(transform: (value: TimerState, time: number) => TimerState) {
    const apply = () => {
      if (disposed) return
      const previous = read() ?? state.value
      const time = Date.now()
      const next = transform(previous, time)
      now.value = time
      save(next)
      if (previous.status === 'running' && next.status === 'finished') {
        onComplete(next, time - (previous.endAt ?? time) > 60_000)
      }
    }
    if (navigator.locks) await navigator.locks.request(TIMER_KEY, apply)
    else apply()
  }

  function tick() {
    now.value = Date.now()
    if (state.value.status === 'running' && remainingTime(state.value, now.value) === 0 && !completing) {
      completing = true
      void update(reconcileTimer).finally(() => {
        completing = false
      })
    }
  }

  function sync() {
    const stored = read()
    if (stored) state.value = stored
    tick()
  }

  function storageChanged(event: StorageEvent) {
    if (event.key === TIMER_KEY || event.key === null) sync()
  }

  onMounted(() => {
    disposed = false
    const stored = read()
    if (stored) state.value = stored
    ready.value = true
    tick()
    ticker = setInterval(tick, 250)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('pageshow', sync)
    window.addEventListener('focus', sync)
    window.addEventListener('storage', storageChanged)
  })

  onBeforeUnmount(() => {
    disposed = true
    clearInterval(ticker)
    document.removeEventListener('visibilitychange', sync)
    window.removeEventListener('pageshow', sync)
    window.removeEventListener('focus', sync)
    window.removeEventListener('storage', storageChanged)
  })

  const remaining = computed(() => remainingTime(state.value, now.value))
  const formatted = computed(() => formatTime(remaining.value))
  const progress = computed(() => remaining.value / state.value.durationMs)

  return {
    state: readonly(state), ready, storageAvailable, remaining, formatted, progress,
    toggle: () => update((value, time) => value.status === 'running' ? pauseTimer(value, time) : startTimer(value, time)),
    reset: (minutes: number, mode: TimerMode) => update(() => createTimer(minutes, mode, crypto.randomUUID())),
    configure: (minutes: number, mode: TimerMode) => update(value => value.status === 'idle' || value.status === 'finished' ? createTimer(minutes, mode, crypto.randomUUID()) : value),
  }
}
