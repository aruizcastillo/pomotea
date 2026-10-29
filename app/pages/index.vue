<script setup lang="ts">
import { ArrowRight, ArrowUpRight, Coffee, Leaf, Pause, Play, RotateCcw } from '@lucide/vue'
import type { TimerMode } from '~/lib/timer'

const { t } = useI18n()
const localePath = useLocalePath()
const { preferences, setPreference, available } = usePreferences()
const alerts = useSessionAlerts()
const lateCompletion = ref(false)
const savedMessage = ref('')
const resetOpen = ref(false)
const timer = usePomodoro((state, late) => {
  lateCompletion.value = late
  if (preferences.value.sound && !late) alerts.chime()
  if (preferences.value.notifications && !late) {
    const isBreak = state.mode === 'break'
    void alerts.notify(t(isBreak ? 'timer.breakCompleteTitle' : 'timer.completeTitle'), t(isBreak ? 'timer.breakCompleteBody' : 'timer.completeBody'), state.id, localePath('/'))
  }
})
const { state, ready, formatted, progress, storageAvailable } = timer
const isActive = computed(() => state.value.status === 'running' || state.value.status === 'paused')
const isFinished = computed(() => state.value.status === 'finished')
const isBreak = computed(() => state.value.mode === 'break')
const statusText = computed(() => {
  if (isFinished.value && lateCompletion.value) return t('timer.late')
  if (state.value.status === 'running' && isBreak.value) return t('timer.breakRunning')
  return t(`timer.${state.value.status}`)
})
const actionText = computed(() => state.value.status === 'running' ? t('timer.pause') : state.value.status === 'paused' ? t('timer.resume') : t(isBreak.value ? 'timer.startBreak' : 'timer.start'))
const modeMinutes = (mode: TimerMode) => mode === 'focus' ? preferences.value.focusMinutes : preferences.value.breakMinutes

useSeoMeta({ title: 'Pomotea', description: () => t('meta.description'), ogTitle: 'Pomotea — A little time, well spent.', ogDescription: () => t('meta.description'), ogType: 'website' })
useHead({
  title: () => isFinished.value ? `${t('timer.completeTitle')} · Pomotea` : `${formatted.value}${state.value.status === 'paused' ? ` · ${t('timer.paused')}` : ''} · Pomotea`,
  meta: [{ name: 'theme-color', content: () => preferences.value.theme === 'coffee' ? '#26231f' : '#f7f6f0' }],
})

watch(() => [preferences.value.focusMinutes, preferences.value.breakMinutes, ready.value], () => {
  if (ready.value && state.value.status === 'idle') void timer.configure(modeMinutes(state.value.mode), state.value.mode)
})

function toggle() {
  if (!ready.value) return
  if (preferences.value.sound) void alerts.unlockSound()
  void timer.toggle()
}

function changeMode(value: unknown) {
  if (isActive.value || (value !== 'focus' && value !== 'break')) return
  lateCompletion.value = false
  void timer.configure(modeMinutes(value), value)
}

async function nextSession(mode: TimerMode) {
  lateCompletion.value = false
  await timer.reset(modeMinutes(mode), mode)
}

function setDuration(value: unknown) {
  if (typeof value !== 'string' || !value) return
  const minutes = Number(value)
  setPreference(isBreak.value ? 'breakMinutes' : 'focusMinutes', minutes)
  void timer.configure(minutes, state.value.mode)
}

async function reset() {
  await nextSession(state.value.mode)
  resetOpen.value = false
}

async function notifications(enabled: boolean) {
  if (!enabled) {
    setPreference('notifications', false)
    return
  }
  if (await alerts.requestPermission()) setPreference('notifications', true)
}

function savePreferences(values: { focusMinutes: number, breakMinutes: number, sound: boolean }) {
  setPreference('focusMinutes', values.focusMinutes)
  setPreference('breakMinutes', values.breakMinutes)
  setPreference('sound', values.sound)
  savedMessage.value = t('settings.saved')
}

async function previewSound() {
  await alerts.unlockSound()
  alerts.chime()
}

function keyboard(event: KeyboardEvent) {
  if (event.code !== 'Space' || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return
  const target = event.target as HTMLElement
  if (target.closest('button, a, input, select, textarea, [contenteditable], [role="dialog"], [role="menu"]') || document.querySelector('[role="dialog"], [role="menu"]') || isFinished.value) return
  event.preventDefault()
  toggle()
}
onMounted(() => window.addEventListener('keydown', keyboard))
onBeforeUnmount(() => window.removeEventListener('keydown', keyboard))
</script>

<template>
  <div
    class="pomotea-shell"
    :data-status="state.status"
  >
    <a
      class="skip-link"
      href="#timer"
    >{{ t('app.skip') }}</a>
    <header class="app-header">
      <a
        class="wordmark"
        :href="localePath('/')"
        aria-label="Pomotea"
      >pomotea<span class="wordmark-dot">.</span></a>
      <p class="header-note">
        {{ t('app.tagline') }}
      </p>
      <nav
        class="header-controls"
        :aria-label="t('app.settings')"
      >
        <LanguageMenu />
        <PreferencesDialog
          :preferences="preferences"
          :permission="alerts.permission.value"
          :notification-failed="alerts.failed.value"
          @save="savePreferences"
          @notifications="notifications"
          @preview="previewSound"
        />
      </nav>
    </header>

    <main
      id="timer"
      class="timer-main"
      tabindex="-1"
    >
      <div class="intro">
        <h1>{{ t(isBreak ? 'timer.breakHeading' : 'timer.heading') }}</h1>
        <p>{{ t(isBreak ? 'timer.breakDescription' : 'timer.description') }}</p>
      </div>

      <div class="ritual-layout">
        <section
          class="cup-stage"
          :aria-label="t('app.theme')"
        >
          <TimerCup
            :progress="progress"
            :running="state.status === 'running'"
          />
          <UiToggleGroup
            type="single"
            :spacing="2"
            :model-value="preferences.theme"
            :aria-label="t('app.theme')"
            class="theme-picker"
            @update:model-value="value => { if (value === 'tea' || value === 'coffee') setPreference('theme', value) }"
          >
            <UiToggleGroupItem value="tea">
              <Leaf />Tea
            </UiToggleGroupItem>
            <UiToggleGroupItem value="coffee">
              <Coffee />Coffee
            </UiToggleGroupItem>
          </UiToggleGroup>
        </section>

        <section
          class="timer-panel"
          :aria-label="t('timer.remaining')"
        >
          <UiToggleGroup
            type="single"
            :spacing="1"
            :model-value="state.mode"
            :disabled="isActive"
            class="mode-picker"
            :aria-label="t('settings.durations')"
            @update:model-value="changeMode"
          >
            <UiToggleGroupItem value="focus">
              {{ t('timer.focus') }}
            </UiToggleGroupItem>
            <UiToggleGroupItem value="break">
              {{ t('timer.break') }}
            </UiToggleGroupItem>
          </UiToggleGroup>
          <div
            class="time-display"
            role="timer"
            aria-live="off"
            :aria-label="`${t('timer.remaining')}: ${formatted}`"
          >
            {{ formatted }}
          </div>
          <p
            class="session-status"
            role="status"
          >
            <span
              class="status-dot"
              :class="{ active: state.status === 'running' }"
            />{{ statusText }}
          </p>

          <div
            v-if="!isActive && !isFinished"
            class="duration-picker"
          >
            <UiToggleGroup
              type="single"
              :spacing="2"
              :model-value="String(state.durationMs / 60_000)"
              :aria-label="t('timer.duration')"
              @update:model-value="setDuration"
            >
              <UiToggleGroupItem
                v-for="minutes in (isBreak ? [5, 10, 15] : [15, 25, 45])"
                :key="minutes"
                :value="String(minutes)"
                :aria-label="`${minutes} ${t('timer.minutes')}`"
              >
                {{ minutes }}
              </UiToggleGroupItem>
              <UiToggleGroupItem
                v-if="!(isBreak ? [5, 10, 15] : [15, 25, 45]).includes(state.durationMs / 60_000)"
                :value="String(state.durationMs / 60_000)"
              >
                {{ state.durationMs / 60_000 }}
              </UiToggleGroupItem>
            </UiToggleGroup>
            <span>min</span>
          </div>
          <p
            v-else
            class="duration-summary"
          >
            {{ t('timer.of', { minutes: state.durationMs / 60_000 }) }}
          </p>

          <div
            v-if="!isFinished"
            class="timer-actions"
          >
            <button
              class="start-button"
              :disabled="!ready"
              @click="toggle"
            >
              <Pause
                v-if="state.status === 'running'"
                :size="18"
              /><Play
                v-else
                :size="18"
              />{{ actionText }}
            </button>
            <UiDialog v-model:open="resetOpen">
              <UiDialogTrigger
                v-if="isActive"
                as-child
              >
                <button
                  class="reset-button"
                  :aria-label="t('timer.reset')"
                  :title="t('timer.reset')"
                >
                  <RotateCcw :size="20" />
                </button>
              </UiDialogTrigger>
              <UiDialogContent :show-close-button="false">
                <UiDialogHeader><UiDialogTitle>{{ t('timer.resetTitle') }}</UiDialogTitle><UiDialogDescription>{{ t('timer.resetDescription') }}</UiDialogDescription></UiDialogHeader>
                <UiDialogFooter>
                  <UiDialogClose as-child>
                    <UiButton variant="outline">
                      {{ t('timer.cancel') }}
                    </UiButton>
                  </UiDialogClose><UiButton @click="reset">
                    {{ t('timer.confirmReset') }}
                  </UiButton>
                </UiDialogFooter>
              </UiDialogContent>
            </UiDialog>
          </div>
          <div
            v-else
            class="completion-actions"
          >
            <button
              class="start-button"
              @click="nextSession(isBreak ? 'focus' : 'break')"
            >
              {{ isBreak ? t('timer.nextFocus') : t('timer.nextBreakCustom', { minutes: preferences.breakMinutes }) }}<ArrowRight :size="18" />
            </button>
            <button
              class="text-action"
              @click="nextSession(state.mode)"
            >
              {{ t('timer.again') }}
            </button>
          </div>
          <p
            v-if="!isFinished"
            class="keyboard-hint"
          >
            <kbd>space</kbd>{{ t('timer.shortcut') }}
          </p>
        </section>
      </div>
      <p
        class="persistence-note"
        role="status"
      >
        {{ !storageAvailable || !available ? t('timer.storageUnavailable') : savedMessage || t('timer.saved') }}
      </p>
    </main>

    <footer class="app-footer">
      <p>
        {{ t('app.credit') }} <a
          href="https://aruizcastillo.com/"
          target="_blank"
          rel="noopener noreferrer"
        >Alex Ruiz Castillo</a>
      </p>
      <div class="footer-links">
        <UiDialog>
          <UiDialogTrigger class="text-action">
            {{ t('app.about') }}
          </UiDialogTrigger>
          <UiDialogContent :show-close-button="false">
            <UiDialogHeader><UiDialogTitle>{{ t('about.title') }}</UiDialogTitle><UiDialogDescription>{{ t('about.description') }}</UiDialogDescription></UiDialogHeader>
            <p class="about-copy">
              {{ t('about.cup') }}
            </p><p class="about-copy">
              {{ t('about.privacy') }}
            </p>
            <UiDialogClose as-child>
              <UiButton variant="outline">
                {{ t('app.close') }}
              </UiButton>
            </UiDialogClose>
          </UiDialogContent>
        </UiDialog>
        <a
          class="source-link"
          href="https://github.com/aruizcastillo/pomotea"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('app.source')"
        ><ArrowUpRight :size="18" /></a>
      </div>
    </footer>
  </div>
</template>
