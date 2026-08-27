<script setup lang="ts">
function savedLogin() {
  if (!import.meta.client) {
    return null
  }
  try {
    const raw = localStorage.getItem('la_login')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saved = savedLogin()
const name = ref<string>(saved?.name ?? '')
const email = ref<string>(saved?.email ?? '')
const remember = ref(true)
const loading = ref(false)
const { notify } = useNotify()

const { data: session } = await useFetch('/api/auth/session')
if (session.value?.user) {
  await navigateTo('/dashboard', { replace: true })
}

async function signIn() {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { name: name.value, email: email.value, remember: remember.value }
    })
    if (remember.value) {
      localStorage.setItem('la_login', JSON.stringify({ name: name.value, email: email.value }))
    } else {
      localStorage.removeItem('la_login')
    }
    notify({ title: `Welcome, ${name.value}`, color: 'success' })
    await navigateTo('/dashboard')
  } catch (err) {
    notify({ title: errorMessage(err), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="dot-surface min-h-dvh lg:grid lg:grid-cols-2">
    <!-- Brand panel -->
    <div class="relative hidden flex-col justify-between overflow-hidden border-r border-(--ui-border) bg-(--ui-bg-elevated) p-10 lg:flex">
      <div class="pointer-events-none absolute -top-40 -left-40 size-[28rem] rounded-full bg-(--ui-primary)/15 blur-3xl" />
      <div class="pointer-events-none absolute right-0 bottom-0 size-72 rounded-full bg-(--ui-primary)/10 blur-3xl" />

      <div class="relative">
        <AppLogo />
      </div>

      <div class="relative max-w-md">
        <p class="mb-3 text-sm font-semibold text-(--ui-primary)">
          Odoo Partner Onboarding
        </p>
        <h1 class="text-4xl font-bold tracking-tight text-balance text-(--ui-text-highlighted)">
          Become an Odoo <span class="bg-gradient-to-r from-(--ui-primary) to-emerald-400 bg-clip-text text-transparent">implementation star</span>, one session at a time.
        </h1>
        <p class="mt-4 leading-relaxed text-(--ui-text-muted)">
          The complete Partner Bootcamp — 27 sessions across 4 tracks — with live progress tracking in one place.
        </p>

        <dl class="mt-8 grid grid-cols-3 gap-6 border-t border-(--ui-border) pt-6">
          <div>
            <dt class="text-xs text-(--ui-text-muted)">
              Sessions
            </dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums text-(--ui-text-highlighted)">
              27
            </dd>
          </div>
          <div>
            <dt class="text-xs text-(--ui-text-muted)">
              Total time
            </dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums text-(--ui-text-highlighted)">
              2d 11h
            </dd>
          </div>
          <div>
            <dt class="text-xs text-(--ui-text-muted)">
              Quizzes
            </dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums text-(--ui-text-highlighted)">
              1,200 XP
            </dd>
          </div>
        </dl>
      </div>

      <p class="relative text-xs text-(--ui-text-muted)">
        Functional · Methodology · Technico-functional · Going further
      </p>
    </div>

    <!-- Form panel -->
    <div class="flex min-h-dvh items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-md">
        <div class="mb-8 flex justify-center lg:hidden">
          <AppLogo />
        </div>

        <UCard>
          <h2 class="text-xl font-semibold tracking-tight text-(--ui-text-highlighted)">
            Welcome to the Bootcamp
          </h2>
          <p class="mt-1 text-sm text-(--ui-text-muted)">
            Enter your name and admin email to continue.
          </p>

          <form
            class="mt-6 space-y-4"
            @submit.prevent="signIn"
          >
            <UFormField
              label="Display name"
              required
            >
              <UInput
                v-model="name"
                size="xl"
                placeholder="Juan Dela Cruz"
                autocomplete="name"
                :autofocus="true"
              />
            </UFormField>

            <UFormField
              label="Leads email"
              required
            >
              <UInput
                v-model="email"
                type="email"
                size="xl"
                placeholder="name@leadsagri.com"
                autocomplete="email"
              />
            </UFormField>

            <UCheckbox
              v-model="remember"
              label="Remember this device"
            />

            <UButton
              type="submit"
              block
              size="xl"
              :loading="loading"
            >
              Sign in
            </UButton>
          </form>
        </UCard>

        <p class="mt-5 text-center text-xs text-(--ui-text-muted)">
          Odoo Bootcamp Tracker
        </p>
      </div>
    </div>
  </div>
</template>
