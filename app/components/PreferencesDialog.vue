<script setup lang="ts">
import { Bell, Check, SlidersHorizontal, Volume2 } from '@lucide/vue'
import type { Preferences } from '~/composables/usePreferences'
import { validMinutes } from '~/lib/timer'

const props = defineProps<{
  preferences: Readonly<Preferences>
  permission: NotificationPermission | 'unsupported'
  notificationFailed: boolean
}>()
const emit = defineEmits<{
  save: [values: { focusMinutes: number, breakMinutes: number, sound: boolean }]
  notifications: [enabled: boolean]
  preview: []
}>()
const open = ref(false)
const focusMinutes = ref<number | string>(25)
const breakMinutes = ref<number | string>(5)
const sound = ref(true)
const submitted = ref(false)
const invalidFocus = computed(() => !validMinutes(Number(focusMinutes.value)))
const invalidBreak = computed(() => !validMinutes(Number(breakMinutes.value)))

watch(open, (value) => {
  if (!value) return
  focusMinutes.value = props.preferences.focusMinutes
  breakMinutes.value = props.preferences.breakMinutes
  sound.value = props.preferences.sound
  submitted.value = false
})

function save() {
  submitted.value = true
  if (invalidFocus.value || invalidBreak.value) return
  emit('save', { focusMinutes: Number(focusMinutes.value), breakMinutes: Number(breakMinutes.value), sound: sound.value })
  open.value = false
}
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogTrigger as-child>
      <UiButton
        variant="ghost"
        size="icon-lg"
        :aria-label="$t('app.settings')"
        :title="$t('app.settings')"
      >
        <SlidersHorizontal />
      </UiButton>
    </UiDialogTrigger>
    <UiDialogContent
      class="preferences-dialog"
      :show-close-button="false"
    >
      <UiDialogHeader>
        <UiDialogTitle>{{ $t('settings.title') }}</UiDialogTitle>
        <UiDialogDescription>{{ $t('settings.description') }}</UiDialogDescription>
      </UiDialogHeader>
      <form
        class="preferences-form"
        novalidate
        @submit.prevent="save"
      >
        <UiFieldGroup>
          <UiFieldSet>
            <UiFieldLegend>{{ $t('settings.durations') }}</UiFieldLegend>
            <div class="duration-fields">
              <UiField :data-invalid="submitted && invalidFocus">
                <UiFieldLabel for="focus-minutes">
                  {{ $t('settings.focusMinutes') }}
                </UiFieldLabel>
                <UiInput
                  id="focus-minutes"
                  v-model="focusMinutes"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  max="180"
                  step="1"
                  :aria-invalid="submitted && invalidFocus"
                  aria-describedby="duration-hint duration-error"
                />
              </UiField>
              <UiField :data-invalid="submitted && invalidBreak">
                <UiFieldLabel for="break-minutes">
                  {{ $t('settings.breakMinutes') }}
                </UiFieldLabel>
                <UiInput
                  id="break-minutes"
                  v-model="breakMinutes"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  max="180"
                  step="1"
                  :aria-invalid="submitted && invalidBreak"
                  aria-describedby="duration-hint duration-error"
                />
              </UiField>
            </div>
            <UiFieldDescription id="duration-hint">
              {{ $t('settings.durationHint') }}
            </UiFieldDescription>
            <p
              id="duration-error"
              class="field-error"
              role="alert"
            >
              {{ submitted && (invalidFocus || invalidBreak) ? $t('settings.invalid') : '' }}
            </p>
          </UiFieldSet>
          <UiField orientation="horizontal">
            <UiFieldContent>
              <UiFieldLabel for="sound">
                {{ $t('settings.sound') }}
              </UiFieldLabel>
              <UiFieldDescription>{{ $t('settings.soundHint') }}</UiFieldDescription>
              <button
                type="button"
                class="text-action preview-sound"
                @click="emit('preview')"
              >
                <Volume2 :size="14" />{{ $t('settings.testSound') }}
              </button>
            </UiFieldContent>
            <UiSwitch
              id="sound"
              v-model="sound"
            />
          </UiField>
        </UiFieldGroup>
        <UiButton
          type="submit"
          size="lg"
          class="w-full"
        >
          {{ $t('settings.save') }}
        </UiButton>
      </form>
      <section
        class="notification-settings"
        aria-labelledby="notification-title"
      >
        <h3 id="notification-title">
          <Bell :size="16" />{{ $t('settings.notifications') }}
        </h3>
        <p>{{ $t('settings.notificationHint') }}</p>
        <UiButton
          v-if="permission !== 'unsupported' && permission !== 'denied'"
          variant="outline"
          @click="emit('notifications', !preferences.notifications)"
        >
          <Check
            v-if="preferences.notifications && permission === 'granted'"
            data-icon="inline-start"
          />
          {{ preferences.notifications && permission === 'granted' ? $t('settings.enabled') : $t('settings.enable') }}
        </UiButton>
        <p v-else>
          {{ $t(`settings.${permission}`) }}
        </p>
        <p
          v-if="notificationFailed"
          role="status"
        >
          {{ $t('settings.failed') }}
        </p>
        <p class="notification-limits">
          {{ $t('settings.limits') }}
        </p>
      </section>
      <details class="install-help">
        <summary>{{ $t('settings.installTitle') }}</summary>
        <p>{{ $t('settings.installHint') }}</p>
      </details>
      <UiDialogClose as-child>
        <UiButton variant="ghost">
          {{ $t('app.close') }}
        </UiButton>
      </UiDialogClose>
    </UiDialogContent>
  </UiDialog>
</template>
