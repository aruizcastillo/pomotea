export type TimerMode = 'focus' | 'break'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface TimerState {
  version: 1
  id: string
  mode: TimerMode
  status: TimerStatus
  durationMs: number
  remainingMs: number
  endAt: number | null
}

export const TIMER_KEY = 'pomotea.timer.v1'
export const MAX_MINUTES = 180

export function validMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_MINUTES
}

export function createTimer(minutes = 25, mode: TimerMode = 'focus', id = ''): TimerState {
  const durationMs = (validMinutes(minutes) ? minutes : 25) * 60_000
  return { version: 1, id, mode, status: 'idle', durationMs, remainingMs: durationMs, endAt: null }
}

export function remainingTime(state: TimerState, now: number): number {
  return state.status === 'running' && state.endAt !== null
    ? Math.max(0, Math.min(state.durationMs, state.endAt - now))
    : state.remainingMs
}

export function reconcileTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state
  const remainingMs = remainingTime(state, now)
  return remainingMs === 0
    ? { ...state, status: 'finished', remainingMs: 0, endAt: null }
    : { ...state, remainingMs }
}

export function startTimer(state: TimerState, now: number): TimerState {
  if (state.status === 'running' || state.status === 'finished') return state
  return { ...state, status: 'running', endAt: now + state.remainingMs }
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  const current = reconcileTimer(state, now)
  return current.status === 'running'
    ? { ...current, status: 'paused', endAt: null }
    : current
}

export function parseTimer(raw: string | null): TimerState | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    if (!value || value.version !== 1 || typeof value.id !== 'string' || value.id.length > 100
      || !['focus', 'break'].includes(value.mode)
      || !['idle', 'running', 'paused', 'finished'].includes(value.status)
      || !Number.isInteger(value.durationMs) || value.durationMs < 60_000 || value.durationMs > MAX_MINUTES * 60_000
      || !Number.isFinite(value.remainingMs) || value.remainingMs < 0 || value.remainingMs > value.durationMs
      || (value.status === 'running' ? !Number.isSafeInteger(value.endAt) || value.endAt <= 0 : value.endAt !== null)
      || (value.status === 'finished' && value.remainingMs !== 0)
      || (value.status === 'paused' && value.remainingMs === 0)
      || (value.status === 'idle' && value.remainingMs !== value.durationMs)) return null
    return { version: 1, id: value.id, mode: value.mode, status: value.status, durationMs: value.durationMs, remainingMs: value.remainingMs, endAt: value.endAt }
  }
  catch { return null }
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000)
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}
