<script setup lang="ts">
import { allSessions, bootcampSections, totalXp, type BootcampSection, type BootcampSession, type UploadMeta } from '#shared/sessions'

const toast = useToast()

const { data: progress, status } = await useFetch<{ user: { name: string, email: string } | null, completed: string[], uploads: Record<string, UploadMeta> }>('/api/progress')
if (!progress.value?.user) {
  await navigateTo('/', { replace: true })
}

const user = computed(() => progress.value?.user)
const completed = reactive(new Set<string>(progress.value?.completed ?? []))
const uploads = reactive<Record<string, UploadMeta>>({ ...progress.value?.uploads })
const fileInputs: Record<string, HTMLInputElement | null> = {}

const total = allSessions.length
const done = computed(() => allSessions.filter(session => completed.has(session.id)).length)
const percent = computed(() => Math.round((done.value / total) * 100))
const xpEarned = computed(() => allSessions.reduce((sum, session) => completed.has(session.id) ? sum + (session.xp ?? 0) : sum, 0))
const uploadCount = computed(() => Object.keys(uploads).length)
const nextSession = computed(() => allSessions.find(session => !completed.has(session.id)))
const initials = computed(() => user.value?.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() ?? '')

function isDone(session: BootcampSession) {
  return completed.has(session.id)
}

function sectionDone(section: BootcampSection) {
  return section.sessions.filter(session => completed.has(session.id)).length
}

async function toggle(session: BootcampSession) {
  const target = !completed.has(session.id)
  if (target) {
    completed.add(session.id)
  } else {
    completed.delete(session.id)
  }
  try {
    await $fetch('/api/progress/toggle', {
      method: 'POST',
      body: { sessionId: session.id, completed: target }
    })
  } catch (err) {
    if (target) {
      completed.delete(session.id)
    } else {
      completed.add(session.id)
    }
    toast.add({ title: errorMessage(err), color: 'error' })
  }
}

function setFileInput(sessionId: string, el: unknown) {
  fileInputs[sessionId] = el as HTMLInputElement | null
}

async function onFilePicked(session: BootcampSession, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }

  const form = new FormData()
  form.append('sessionId', session.id)
  form.append('file', file)

  try {
    const res = await $fetch<{ upload: UploadMeta }>('/api/progress/upload', {
      method: 'POST',
      body: form
    })
    uploads[session.id] = res.upload
    toast.add({ title: `${file.name} uploaded`, color: 'success' })
  } catch (err) {
    toast.add({ title: errorMessage(err), color: 'error' })
  }
}

async function removeUpload(session: BootcampSession) {
  try {
    await $fetch(`/api/progress/upload?sessionId=${session.id}`, { method: 'DELETE' })
    Reflect.deleteProperty(uploads, session.id)
    toast.add({ title: 'Upload removed', color: 'neutral' })
  } catch (err) {
    toast.add({ title: errorMessage(err), color: 'error' })
  }
}

async function signOut() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/', { replace: true })
}
</script>

<template>
  <div class="min-h-dvh bg-(--ui-bg)">
    <header class="sticky top-0 z-10 border-b border-(--ui-border) bg-(--ui-bg)/80 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <NuxtLink
          to="/dashboard"
          class="rounded-md focus-visible:outline-2 focus-visible:outline-(--ui-primary)"
        >
          <AppLogo />
        </NuxtLink>

        <div class="flex items-center gap-2">
          <div class="hidden items-center gap-2 rounded-full border border-(--ui-border) py-1.5 ps-1.5 pe-4 sm:flex">
            <span class="grid size-7 shrink-0 place-items-center rounded-full bg-(--ui-primary) text-xs font-semibold text-(--ui-bg)">
              {{ initials }}
            </span>
            <div class="text-sm leading-tight">
              <p class="font-medium text-(--ui-text-highlighted)">
                {{ user?.name }}
              </p>
              <p class="text-xs text-(--ui-text-muted)">
                {{ user?.email }}
              </p>
            </div>
          </div>
          <UColorModeButton />
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            aria-label="Sign out"
            @click="signOut"
          />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div
        v-if="status === 'pending'"
        class="flex justify-center py-24"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-(--ui-text-muted)"
        />
      </div>

      <div
        v-else
        class="grid items-start gap-8 lg:grid-cols-[340px_1fr]"
      >
        <!-- Summary -->
        <aside>
          <UCard class="lg:sticky lg:top-24">
            <div class="flex items-baseline justify-between">
              <p class="text-sm font-medium text-(--ui-text-muted)">
                Overall progress
              </p>
              <p class="text-4xl font-bold tabular-nums tracking-tight text-(--ui-text-highlighted)">
                {{ percent }}%
              </p>
            </div>

            <UProgress
              :model-value="percent"
              size="lg"
              class="mt-4"
            />

            <dl class="mt-6 grid grid-cols-2 gap-5">
              <div>
                <dt class="text-xs text-(--ui-text-muted)">
                  Sessions done
                </dt>
                <dd class="mt-1 text-lg font-semibold tabular-nums text-(--ui-text-highlighted)">
                  {{ done }} / {{ total }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-(--ui-text-muted)">
                  XP earned
                </dt>
                <dd class="mt-1 text-lg font-semibold tabular-nums text-(--ui-text-highlighted)">
                  {{ xpEarned }} / {{ totalXp }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-(--ui-text-muted)">
                  Deliverables
                </dt>
                <dd class="mt-1 text-lg font-semibold tabular-nums text-(--ui-text-highlighted)">
                  {{ uploadCount }} uploaded
                </dd>
              </div>
              <div>
                <dt class="text-xs text-(--ui-text-muted)">
                  Next session
                </dt>
                <dd class="mt-1 text-lg font-semibold text-(--ui-text-highlighted)">
                  {{ nextSession ? `#${nextSession.number}` : '—' }}
                </dd>
              </div>
            </dl>

            <template #footer>
              <p
                v-if="nextSession"
                class="text-sm text-(--ui-text-muted)"
              >
                Up next:
                <span class="font-medium text-(--ui-text-highlighted)">{{ nextSession.title }}</span>
              </p>

              <div
                v-else
                class="flex items-center gap-3 rounded-lg border border-(--ui-primary)/30 bg-(--ui-primary)/10 p-4"
              >
                <UIcon
                  name="i-lucide-party-popper"
                  class="size-6 shrink-0 text-(--ui-primary)"
                />
                <div>
                  <p class="text-sm font-semibold text-(--ui-text-highlighted)">
                    Bootcamp complete
                  </p>
                  <p class="text-xs text-(--ui-text-muted)">
                    All 27 sessions done. Congratulations!
                  </p>
                </div>
              </div>
            </template>
          </UCard>
        </aside>

        <!-- Sessions -->
        <div class="space-y-10">
          <section
            v-for="section in bootcampSections"
            :key="section.id"
          >
            <div class="mb-4 flex items-end justify-between">
              <div>
                <h2 class="text-lg font-semibold tracking-tight text-(--ui-text-highlighted)">
                  {{ section.name }}
                </h2>
                <p class="mt-0.5 text-sm text-(--ui-text-muted)">
                  {{ section.sessions.length }} sessions · {{ section.duration }}
                </p>
              </div>
              <UBadge
                variant="subtle"
                color="neutral"
              >
                {{ sectionDone(section) }}/{{ section.sessions.length }}
              </UBadge>
            </div>

            <UCard>
              <ul class="divide-y divide-(--ui-border)">
                <li
                  v-for="session in section.sessions"
                  :key="session.id"
                  class="flex items-center gap-4 py-4 first:pt-1 last:pb-1"
                >
                  <span
                    class="grid size-9 shrink-0 place-items-center rounded-full border text-sm font-semibold tabular-nums"
                    :class="isDone(session)
                      ? 'border-(--ui-primary) bg-(--ui-primary) text-(--ui-bg)'
                      : 'border-(--ui-border) text-(--ui-text-muted)'"
                  >
                    <UIcon
                      v-if="isDone(session)"
                      name="i-lucide-check"
                      class="size-4"
                    />
                    <template v-else>{{ session.number }}</template>
                  </span>

                  <div class="min-w-0 flex-1">
                    <p
                      class="text-sm font-medium"
                      :class="isDone(session) ? 'text-(--ui-text-muted) line-through' : 'text-(--ui-text-highlighted)'"
                    >
                      {{ session.title }}
                    </p>

                    <div class="mt-2 flex flex-wrap items-center gap-2">
                      <UBadge
                        v-if="session.xp"
                        variant="outline"
                        color="neutral"
                        size="sm"
                      >
                        {{ session.xp }} XP
                      </UBadge>

                      <template v-if="session.uploadLabel">
                        <div
                          v-if="uploads[session.id]"
                          class="flex items-center gap-1.5 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) py-1 ps-2 pe-1 text-xs"
                        >
                          <UIcon
                            name="i-lucide-file-text"
                            class="size-4 shrink-0 text-(--ui-primary)"
                          />
                          <a
                            :href="`/api/progress/download?sessionId=${session.id}`"
                            class="max-w-44 truncate font-medium text-(--ui-text-highlighted) hover:underline"
                          >
                            {{ uploads[session.id]?.name }}
                          </a>
                          <span class="shrink-0 text-(--ui-text-muted)">{{ formatSize(uploads[session.id]?.size ?? 0) }}</span>
                          <UButton
                            icon="i-lucide-x"
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            aria-label="Remove upload"
                            @click="removeUpload(session)"
                          />
                        </div>
                        <UButton
                          v-else
                          size="xs"
                          variant="outline"
                          color="neutral"
                          icon="i-lucide-upload"
                          @click="fileInputs[session.id]?.click()"
                        >
                          Upload output
                        </UButton>
                        <input
                          :ref="el => setFileInput(session.id, el)"
                          type="file"
                          class="hidden"
                          @change="onFilePicked(session, $event)"
                        >
                      </template>
                    </div>
                  </div>

                  <UCheckbox
                    :model-value="isDone(session)"
                    size="lg"
                    :aria-label="`Mark ${session.title} as done`"
                    @update:model-value="toggle(session)"
                  />
                </li>
              </ul>
            </UCard>
          </section>

          <p class="pb-4 text-center text-xs text-(--ui-text-muted)">
            Sessions follow the official Odoo Partner Bootcamp curriculum.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
