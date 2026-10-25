import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTimer, formatTime, parseTimer, pauseTimer, reconcileTimer, remainingTime, startTimer, validMinutes } from '../app/lib/timer.ts'

test('elapsed wall time, not interval count, determines remaining time', () => {
  const timer = startTimer(createTimer(25), 1000)
  assert.equal(remainingTime(timer, 601_000), 900_000)
  assert.equal(remainingTime(timer, 50_000_000), 0)
})
test('pause and resume preserve fractional seconds without cumulative drift', () => {
  const running = startTimer(createTimer(1), 1000)
  const paused = pauseTimer(running, 1234)
  assert.equal(paused.remainingMs, 59_766)
  assert.equal(remainingTime(paused, 1_000_000), 59_766)
  assert.equal(startTimer(paused, 2_000_000).endAt, 2_059_766)
})
test('reload restores the original deadline and a finished session stays finished', () => {
  const running = startTimer(createTimer(1), 1000)
  const restored = parseTimer(JSON.stringify(running))!
  assert.equal(restored.endAt, 61_000)
  const completed = reconcileTimer(restored, 65_000)
  assert.equal(completed.status, 'finished')
  assert.equal(completed.remainingMs, 0)
  assert.deepEqual(reconcileTimer(completed, 999_999), completed)
  assert.deepEqual(parseTimer(JSON.stringify(completed)), completed)
})
test('pausing at the deadline completes instead of creating a zero-second paused session', () => {
  assert.equal(pauseTimer(startTimer(createTimer(1), 1000), 61_000).status, 'finished')
})
test('backward clock movement cannot overfill the cup', () => {
  assert.equal(remainingTime(startTimer(createTimer(1), 50_000), 1000), 60_000)
})
test('reset creates a full independent session and mode', () => {
  const reset = createTimer(5, 'break', 'new-session')
  assert.equal(reset.mode, 'break')
  assert.equal(reset.status, 'idle')
  assert.equal(reset.endAt, null)
  assert.equal(reset.remainingMs, 300_000)
})
test('duration bounds reject blank, fractional, infinite and excessive values', () => {
  for (const value of ['', null, 0, -1, 1.5, 181, Infinity, NaN, '25']) assert.equal(validMinutes(value), false)
  assert.equal(validMinutes(1), true)
  assert.equal(validMinutes(180), true)
})
test('malformed and inconsistent storage is rejected', () => {
  for (const raw of ['{', 'null', '{}', '[]', '1']) assert.equal(parseTimer(raw), null)
  const base = createTimer()
  for (const mutation of [{ version: 2 }, { remainingMs: -1 }, { durationMs: 0 }, { mode: 'unknown' }, { status: 'running', endAt: null }, { status: 'paused', remainingMs: 0 }, { status: 'finished' }, { endAt: 123 }, { remainingMs: 1e20 }]) {
    assert.equal(parseTimer(JSON.stringify({ ...base, ...mutation })), null)
  }
})
test('display rounds up, stays nonnegative and supports long sessions', () => {
  assert.equal(formatTime(59_999), '01:00')
  assert.equal(formatTime(1), '00:01')
  assert.equal(formatTime(-10), '00:00')
  assert.equal(formatTime(180 * 60_000), '180:00')
})
