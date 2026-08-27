<script setup lang="ts">
import type { NotificationColor } from '~/composables/useNotify'

const { notifications, dismiss } = useNotify()

const tileClass: Record<NotificationColor, string> = {
  error: 'bg-red-500/15 text-red-500',
  success: 'bg-(--ui-primary)/15 text-(--ui-primary)',
  info: 'bg-sky-500/15 text-sky-500'
}

const tileIcon: Record<NotificationColor, string> = {
  error: 'i-lucide-circle-alert',
  success: 'i-lucide-circle-check',
  info: 'i-lucide-info'
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
    <TransitionGroup
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="-translate-y-6 scale-95 opacity-0"
      leave-active-class="transition duration-300 ease-in"
      leave-to-class="-translate-y-4 scale-95 opacity-0"
    >
      <button
        v-for="notification in notifications"
        :key="notification.id"
        type="button"
        class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-(--ui-border) bg-(--ui-bg-elevated)/80 p-3 text-start shadow-lg shadow-black/10 backdrop-blur-xl"
        @click="dismiss(notification.id)"
      >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-xl"
          :class="tileClass[notification.color]"
        >
          <UIcon
            :name="tileIcon[notification.color]"
            class="size-5"
          />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-(--ui-text-highlighted)">
            {{ notification.title }}
          </span>
          <span
            v-if="notification.message"
            class="mt-0.5 block text-xs text-(--ui-text-muted)"
          >
            {{ notification.message }}
          </span>
        </span>
      </button>
    </TransitionGroup>
  </div>
</template>
