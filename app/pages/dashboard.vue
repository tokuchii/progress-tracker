<script setup lang="ts">
import { allSessions, bootcampSections, totalXp, type AssignedMember, type BootcampSection, type BootcampSession, type Member, type MemberStat } from '#shared/sessions'

const { notify } = useNotify()

const { data: progress, status } = await useFetch<{ user: { name: string, email: string } | null, completed: string[] }>('/api/progress')
if (!progress.value?.user) {
  await navigateTo('/', { replace: true })
}

const { data: assignmentData, refresh: refreshAssignments } = await useFetch<{ bySession: Record<string, AssignedMember[]>, members: Member[], stats: MemberStat[] }>('/api/assignments')
const members = reactive<Member[]>([...(assignmentData.value?.members ?? [])])
const assigned = reactive<Record<string, AssignedMember[]>>({ ...assignmentData.value?.bySession })

watch(assignmentData, (data) => {
  const fresh = data?.bySession ?? {}
  for (const key of Object.keys(assigned)) {
    if (!(key in fresh)) {
      Reflect.deleteProperty(assigned, key)
    }
  }
  Object.assign(assigned, fresh)
})

let assignmentsTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  assignmentsTimer = setInterval(() => refreshAssignments().catch(() => {}), 30_000)
})

onUnmounted(() => {
  clearInterval(assignmentsTimer)
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
})

const user = computed(() => progress.value?.user)
const completed = reactive(new Set<string>(progress.value?.completed ?? []))

const total = allSessions.length
const done = computed(() => allSessions.filter(session => completed.has(session.id)).length)
const percent = computed(() => Math.round((done.value / total) * 100))
const xpEarned = computed(() => allSessions.reduce((sum, session) => completed.has(session.id) ? sum + (session.xp ?? 0) : sum, 0))
const memberStats = computed(() => {
  const trackedEmails = new Set(Object.values(assigned).flat().map(member => member.email))
  if (user.value?.email) {
    trackedEmails.add(user.value.email)
  }
  return (assignmentData.value?.stats ?? [])
    .filter(stat => trackedEmails.has(stat.email))
    .map(stat => ({ ...stat, pct: stat.total > 0 ? Math.min(100, Math.round(stat.done / stat.total * 100)) : 0 }))
    .sort((a, b) => b.done - a.done)
})
const memberColors = [
  'var(--color-member-1)',
  'var(--color-member-2)',
  'var(--color-member-3)',
  'var(--color-member-4)',
  'var(--color-member-5)',
  'var(--color-member-6)',
  'var(--color-member-7)',
  'var(--color-member-8)',
  'var(--color-member-9)',
  'var(--color-member-10)'
]
const donutRadius = 17
const donutCircumference = 2 * Math.PI * donutRadius
const donutSegments = computed(() => {
  const totalDone = memberStats.value.reduce((sum, stat) => sum + stat.done, 0)
  if (!totalDone) {
    return []
  }
  let acc = 0
  return memberStats.value.map((stat, index) => {
    const share = stat.done / totalDone
    const start = acc
    acc += share
    const angle = ((start + acc) / 2) * 2 * Math.PI - Math.PI / 2
    return {
      ...stat,
      color: memberColors[index % memberColors.length],
      share,
      dashLength: share * donutCircumference,
      dashOffset: -start * donutCircumference,
      labelX: 28 + 24 * Math.cos(angle),
      labelY: 28 + 24 * Math.sin(angle)
    }
  })
})
const initials = computed(() => initialsOf(user.value?.name ?? ''))

const { data: notepadData } = await useFetch<{ text: string }>('/api/notepad')
const notepadHtml = ref<string>(notepadData.value?.text ?? '')
const lastSaved = ref<Date | null>(null)

let saveTimer: ReturnType<typeof setTimeout> | undefined

watch(notepadHtml, (value) => {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  saveTimer = setTimeout(async () => {
    try {
      await $fetch('/api/notepad', { method: 'POST', body: { text: value } })
      lastSaved.value = new Date()
    } catch (err) {
      notify({ title: 'Could not save notes', message: errorMessage(err), color: 'error' })
    }
  }, 800)
})

interface NotepadRun {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  background?: string
  color?: string
}

function collectRuns(root: Node): NotepadRun[] {
  const runs: NotepadRun[] = []
  const walk = (node: Node, bold: boolean, italic: boolean, underline: boolean, background?: string, color?: string) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) {
        runs.push({ text, bold, italic, underline, background, color })
      }
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }
    const el = node as HTMLElement
    for (const child of Array.from(el.childNodes)) {
      walk(
        child,
        bold || el.tagName === 'STRONG' || el.tagName === 'B',
        italic || el.tagName === 'EM' || el.tagName === 'I',
        underline || el.tagName === 'U',
        el.style.backgroundColor || background,
        el.style.color || color
      )
    }
  }
  walk(root, false, false, false, undefined, undefined)
  return runs
}

async function exportPdf() {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxWidth = pageWidth - margin * 2
  const fontSize = 11
  const lineHeight = 6.5

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Odoo Bootcamp Tracker — Questions', margin, 18)
  doc.setFontSize(fontSize)

  const container = document.createElement('div')
  container.innerHTML = notepadHtml.value || ''
  const blocks = Array.from(container.querySelectorAll('p, li')) as HTMLElement[]

  const fontKey = (run: NotepadRun) => run.bold && run.italic ? 'bolditalic' : run.bold ? 'bold' : run.italic ? 'italic' : 'normal'
  const measure = (run: NotepadRun, text: string) => {
    doc.setFont('helvetica', fontKey(run))
    return doc.getTextWidth(text)
  }

  let y = 28
  let orderedIndex = 0
  let drewAny = false

  for (const block of blocks) {
    const runs = collectRuns(block)
    if (!(block.textContent ?? '').trim()) {
      continue
    }
    drewAny = true

    let prefix = ''
    if (block.tagName === 'LI') {
      const listType = block.dataset.list || (block.parentElement?.tagName === 'OL' ? 'ordered' : 'bullet')
      prefix = listType === 'ordered' ? `${++orderedIndex}. ` : '\u2022 '
    } else {
      orderedIndex = 0
    }

    type Token = { text: string, run: NotepadRun }
    const tokens: Token[] = []
    for (const run of runs) {
      for (const word of run.text.match(/\S+\s*/g) ?? []) {
        tokens.push({ text: word, run })
      }
    }

    const lines: Token[][] = [[]]
    doc.setFont('helvetica', 'normal')
    let lineWidth = prefix ? doc.getTextWidth(prefix) : 0
    for (const token of tokens) {
      const width = measure(token.run, token.text)
      const last = lines[lines.length - 1]!
      if (lineWidth + width > maxWidth && last.length > 0) {
        lines.push([])
        lineWidth = 0
      }
      lines[lines.length - 1]!.push(token)
      lineWidth += width
    }

    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin + 4
      }
      let x = margin
      if (line === lines[0] && prefix) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)
        doc.text(prefix, x, y)
        x += doc.getTextWidth(prefix)
      }
      for (const token of line) {
        const width = measure(token.run, token.text)
        if (token.run.background) {
          const bg = token.run.background.match(/\d+/g)?.map(Number) ?? []
          if (bg.length === 3) {
            doc.setFillColor(bg[0]!, bg[1]!, bg[2]!)
            doc.rect(x, y - fontSize * 0.85, width, fontSize * 1.2, 'F')
          }
        }
        const fg = token.run.color?.match(/\d+/g)?.map(Number) ?? []
        doc.setTextColor(fg.length === 3 ? fg[0]! : 30, fg.length === 3 ? fg[1]! : 30, fg.length === 3 ? fg[2]! : 30)
        doc.setFont('helvetica', fontKey(token.run))
        doc.text(token.text, x, y)
        if (token.run.underline) {
          const underlineColor = fg.length === 3 ? fg : [30, 30, 30]
          doc.setDrawColor(underlineColor[0]!, underlineColor[1]!, underlineColor[2]!)
          doc.line(x, y + 1.5, x + width, y + 1.5)
        }
        x += width
      }
      y += lineHeight
    }
    y += 2
  }

  if (!drewAny) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text('No questions yet.', margin, 28)
  }

  doc.save('bootcamp-questions.pdf')
}

async function exportExcel() {
  const XLSX = await import('xlsx')
  const data: (string | number)[][] = [
    ['Odoo Bootcamp Tracker — Progress Overview'],
    [`Exported ${new Date().toLocaleString()}`],
    [],
    ['Overall progress %', percent.value],
    ['Avg sessions done', `${done.value} / ${total}`],
    ['XP earned', `${xpEarned.value} / ${totalXp}`],
    [],
    ['Member', 'Email', 'Sessions done', 'Total sessions', 'Progress %'],
    ...memberStats.value.map(stat => [stat.name, stat.email, stat.done, stat.total, stat.pct])
  ]
  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = [{ wch: 26 }, { wch: 34 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Progress')
  XLSX.writeFile(book, 'bootcamp-progress.xlsx')
}

function isDone(session: BootcampSession) {
  return completed.has(session.id)
}

function initialsOf(name: string) {
  return name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()
}

function sectionDone(section: BootcampSection) {
  return section.sessions.filter(session => completed.has(session.id)).length
}

function sectionXp(section: BootcampSection) {
  return section.sessions.reduce((sum, session) => sum + (session.xp ?? 0), 0)
}

function isAssigned(session: BootcampSession, member: Member) {
  return (assigned[session.id] ?? []).some(entry => entry.email === member.email)
}

async function setAssigned(session: BootcampSession, member: Member, on: boolean) {
  const current = assigned[session.id] ?? []
  const next = on
    ? [...current.filter(entry => entry.email !== member.email), { ...member, completed: false }]
    : current.filter(entry => entry.email !== member.email)
  assigned[session.id] = next
  try {
    const res = await $fetch<{ members: AssignedMember[] }>('/api/assignments/update', {
      method: 'POST',
      body: { sessionId: session.id, members: next }
    })
    assigned[session.id] = res.members
    await refreshAssignments()
    notify({
      title: on ? 'Member assigned' : 'Member unassigned',
      message: `${member.name} · ${session.title}`,
      color: 'success'
    })
  } catch (err) {
    assigned[session.id] = current
    notify({ title: errorMessage(err), color: 'error' })
  }
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
    await refreshAssignments()
    notify({
      title: target ? 'Session marked done' : 'Session marked not done',
      message: session.title,
      color: 'success'
    })
  } catch (err) {
    if (target) {
      completed.delete(session.id)
    } else {
      completed.add(session.id)
    }
    notify({ title: errorMessage(err), color: 'error' })
  }
}

async function signOut() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/', { replace: true })
}
</script>

<template>
  <div class="dot-surface min-h-dvh bg-(--ui-bg)">
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
        class="grid items-start gap-8 lg:grid-cols-[320px_1fr_320px]"
      >
        <!-- Summary -->
        <aside>
          <div class="relative lg:sticky lg:top-24">
            <div class="pointer-events-none absolute -top-8 -right-8 size-48 rounded-full bg-(--ui-primary)/15 blur-3xl" />
            <UCard class="relative">
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
              </dl>

              <UButton
                icon="i-lucide-file-spreadsheet"
                size="xs"
                variant="subtle"
                color="neutral"
                class="mt-5"
                @click="exportExcel"
              >
                Export progress (Excel)
              </UButton>

              <div class="mt-6 border-t border-(--ui-border) pt-5">
                <p class="text-sm font-medium text-(--ui-text-muted)">
                  Member progress
                </p>
                <div
                  v-if="donutSegments.length"
                  class="relative mx-auto mt-4 size-40"
                >
                  <svg
                    viewBox="0 0 56 56"
                    class="size-full -rotate-90"
                  >
                    <circle
                      cx="28"
                      cy="28"
                      :r="donutRadius"
                      fill="none"
                      class="stroke-(--ui-border)"
                      stroke-width="2"
                    />
                    <circle
                      v-for="seg in donutSegments"
                      :key="seg.email"
                      cx="28"
                      cy="28"
                      :r="donutRadius"
                      fill="none"
                      :stroke="seg.color"
                      stroke-width="2"
                      class="transition-[stroke-dasharray,stroke-dashoffset] duration-700 ease-out"
                      :stroke-dasharray="`${seg.dashLength} ${donutCircumference - seg.dashLength}`"
                      :stroke-dashoffset="seg.dashOffset"
                    />
                  </svg>
                  <svg
                    viewBox="0 0 56 56"
                    class="pointer-events-none absolute inset-0 size-full"
                  >
                    <text
                      v-for="seg in donutSegments.filter(segment => segment.share >= 0.04)"
                      :key="`label-${seg.email}`"
                      :x="seg.labelX"
                      :y="seg.labelY"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="fill-(--ui-text-muted) text-[3.2px]"
                    >
                      {{ Math.round(seg.share * 100) }}%
                    </text>
                  </svg>
                </div>
                <p
                  v-else-if="memberStats.length"
                  class="mt-4 text-xs text-(--ui-text-muted)"
                >
                  No sessions done yet — tick sessions to fill the chart.
                </p>
                <ul
                  v-if="memberStats.length"
                  class="mt-4 space-y-3"
                >
                  <li
                    v-for="(stat, index) in memberStats"
                    :key="stat.email"
                    class="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-(--ui-bg-elevated)/60"
                  >
                    <span
                      class="size-2.5 shrink-0 rounded-full"
                      :style="{ backgroundColor: memberColors[index % memberColors.length] }"
                    />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-(--ui-text-highlighted)">
                        {{ stat.name }}
                        <UBadge
                          v-if="stat.email === user?.email"
                          size="xs"
                          variant="subtle"
                          color="primary"
                          class="ms-1"
                        >
                          You
                        </UBadge>
                      </p>
                      <p class="text-xs text-(--ui-text-muted)">
                        {{ stat.done }} / {{ stat.total }} sessions
                      </p>
                    </div>
                    <p class="text-sm font-semibold tabular-nums text-(--ui-text-highlighted)">
                      {{ stat.pct }}%
                    </p>
                  </li>
                </ul>
                <p
                  v-else
                  class="mt-3 text-xs text-(--ui-text-muted)"
                >
                  No members added yet — use the + button on a session to add them.
                </p>
              </div>
            </UCard>
          </div>
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

            <div class="overflow-hidden rounded-xl border border-(--ui-border) bg-(--ui-bg)">
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="bg-(--ui-bg-elevated) text-xs text-(--ui-text-muted)">
                    <th class="border-e border-(--ui-border) px-3 py-2 text-end font-semibold">
                      #
                    </th>
                    <th class="border-e border-(--ui-border) px-3 py-2 text-start font-semibold">
                      Session
                    </th>
                    <th class="border-e border-(--ui-border) px-3 py-2 text-end font-semibold">
                      XP
                    </th>
                    <th class="border-e border-(--ui-border) px-3 py-2 text-end font-semibold">
                      Members
                    </th>
                    <th class="px-3 py-2 text-end font-semibold">
                      Done
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(session, index) in section.sessions"
                    :key="session.id"
                    class="border-b border-(--ui-border) last:border-0 transition-colors hover:bg-(--ui-bg-elevated)/60"
                    :class="index % 2 === 1 ? 'bg-(--ui-bg-elevated)/40' : ''"
                  >
                    <td class="border-e border-(--ui-border) px-3 py-2.5 text-end text-xs tabular-nums text-(--ui-text-muted)">
                      {{ session.number }}
                    </td>
                    <td class="border-e border-(--ui-border) px-3 py-2.5">
                      <p
                        class="font-medium"
                        :class="isDone(session) ? 'text-(--ui-text-muted) line-through' : 'text-(--ui-text-highlighted)'"
                      >
                        {{ session.title }}
                      </p>
                    </td>
                    <td class="border-e border-(--ui-border) px-3 py-2.5 text-end text-xs tabular-nums text-(--ui-text-muted)">
                      {{ session.xp ?? '—' }}
                    </td>
                    <td class="border-e border-(--ui-border) px-3 py-2.5">
                      <div class="flex items-center justify-end">
                        <div class="flex -space-x-1.5">
                          <UTooltip
                            v-for="member in assigned[session.id] ?? []"
                            :key="member.email"
                            :text="member.name"
                          >
                            <span class="grid size-6 cursor-default place-items-center rounded-full bg-(--ui-primary) text-[10px] font-semibold text-(--ui-bg) ring-2 ring-(--ui-bg)">
                              {{ initialsOf(member.name) }}
                            </span>
                          </UTooltip>
                        </div>
                        <UPopover class="ms-2">
                          <UButton
                            icon="i-lucide-user-plus"
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            aria-label="Assign members"
                          />
                          <template #content>
                            <div class="w-60 p-2">
                              <p class="px-2 pb-1 text-xs font-medium text-(--ui-text-muted)">
                                Assign members
                              </p>
                              <ul v-if="members.length">
                                <li
                                  v-for="member in members"
                                  :key="member.email"
                                  class="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-(--ui-bg-elevated)"
                                >
                                  <span class="truncate text-sm font-medium">{{ member.name }}</span>
                                  <UCheckbox
                                    :model-value="isAssigned(session, member)"
                                    :aria-label="`Assign ${member.name}`"
                                    @update:model-value="setAssigned(session, member, Boolean($event))"
                                  />
                                </li>
                              </ul>
                              <p
                                v-else
                                class="px-2 py-1 text-xs text-(--ui-text-muted)"
                              >
                                No members yet — they appear here once they sign in.
                              </p>
                            </div>
                          </template>
                        </UPopover>
                      </div>
                    </td>
                    <td class="px-3 py-2.5 text-end">
                      <UCheckbox
                        :model-value="isDone(session)"
                        :aria-label="`Mark ${session.title} as done`"
                        @update:model-value="toggle(session)"
                      />
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="border-t border-(--ui-border) bg-(--ui-bg-elevated)/60 text-xs font-semibold text-(--ui-text-highlighted)">
                    <td class="border-e border-(--ui-border) px-3 py-2">
                      Total
                    </td>
                    <td class="border-e border-(--ui-border) px-3 py-2 font-medium text-(--ui-text-muted)">
                      {{ sectionDone(section) }} of {{ section.sessions.length }} done
                    </td>
                    <td class="border-e border-(--ui-border) px-3 py-2 text-end tabular-nums">
                      {{ sectionXp(section) ? `${sectionXp(section)} XP` : '—' }}
                    </td>
                    <td class="border-e border-(--ui-border) px-3 py-2" />
                    <td class="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <p class="pb-4 text-center text-xs text-(--ui-text-muted)">
            Sessions follow the official Odoo Partner Bootcamp curriculum.
          </p>
        </div>

        <!-- Asked Questions   -->
        <aside class="lg:sticky lg:top-24">
          <UButton
            icon="i-lucide-file-down"
            size="xs"
            variant="subtle"
            color="neutral"
            @click="exportPdf"
          >
            Export PDF
          </UButton>
          <UCard class="mt-3">
            <p class="text-sm font-medium text-(--ui-text-muted)">
              Asked Questions
            </p>
            <AppNotepadEditor
              v-model="notepadHtml"
              class="mt-3"
              placeholder="Paste member questions here…"
            />
            <p class="mt-3 text-xs text-(--ui-text-muted)">
              {{ lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Auto-saves as you type' }}
            </p>
          </UCard>
        </aside>
      </div>
    </main>
  </div>
</template>
