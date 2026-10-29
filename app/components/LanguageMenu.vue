<script setup lang="ts">
import { ChevronDown, Languages } from '@lucide/vue'
import {
  DropdownMenu as UiDropdownMenu,
  DropdownMenuContent as UiDropdownMenuContent,
  DropdownMenuLabel as UiDropdownMenuLabel,
  DropdownMenuRadioGroup as UiDropdownMenuRadioGroup,
  DropdownMenuRadioItem as UiDropdownMenuRadioItem,
  DropdownMenuTrigger as UiDropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

const { t, locale, locales, setLocale } = useI18n()

function selectLocale(value: unknown) {
  const selected = locales.value.find(option => option.code === value)
  if (selected) void setLocale(selected.code)
}
</script>

<template>
  <UiDropdownMenu :modal="false">
    <UiDropdownMenuTrigger as-child>
      <UiButton
        variant="ghost"
        class="language-trigger"
        :aria-label="`${t('app.language')}: ${locales.find(option => option.code === locale)?.name ?? locale}`"
      >
        <Languages aria-hidden="true" />
        <span>{{ locale.toUpperCase() }}</span>
        <ChevronDown
          class="language-chevron"
          aria-hidden="true"
        />
      </UiButton>
    </UiDropdownMenuTrigger>
    <UiDropdownMenuContent
      align="end"
      :side-offset="8"
      class="language-menu"
    >
      <UiDropdownMenuLabel>{{ t('app.language') }}</UiDropdownMenuLabel>
      <UiDropdownMenuRadioGroup
        :model-value="locale"
        @update:model-value="selectLocale"
      >
        <UiDropdownMenuRadioItem
          v-for="option in locales"
          :key="option.code"
          :value="option.code"
          :lang="option.language"
        >
          {{ option.name ?? option.code }}
        </UiDropdownMenuRadioItem>
      </UiDropdownMenuRadioGroup>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>
