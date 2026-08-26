<script setup lang="ts">
const step = ref<'form' | 'otp'>('form')
const name = ref('')
const email = ref('')
const code = ref<string[]>([])
const error = ref('')
const loading = ref(false)
const devCode = ref<string | undefined>()
const resendIn = ref(0)
let resendTimer: ReturnType<typeof setInterval> | undefined

onBeforeUnmount(() => {
  if (resendTimer) {
    clearInterval(resendTimer)
  }
})

const { data: session } = await useFetch('/api/auth/session')
if (session.value?.user) {
  await navigateTo('/dashboard', { replace: true })
}

async function requestCode() {
  if (loading.value) {
    return
  }
  loading.value = true
  error.value = ''
  devCode.value = undefined
  try {
    const res = await $fetch<{ ok: boolean, devCode?: string }>('/api/auth/request-otp', {
      method: 'POST',
      body: { name: name.value, email: email.value }
    })
    devCode.value = res.devCode
    code.value = []
    step.value = 'otp'
    resendIn.value = 30
    resendTimer = setInterval(() => {
      resendIn.value -= 1
      if (resendIn.value <= 0 && resendTimer) {
        clearInterval(resendTimer)
      }
    }, 1000)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}

async function verifyCode() {
  if (loading.value || code.value.length !== 6) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/verify-otp', {
      method: 'POST',
      body: { email: email.value, code: code.value.join('') }
    })
    await navigateTo('/dashboard')
  } catch (err) {
    error.value = errorMessage(err)
    code.value = []
  } finally {
    loading.value = false
  }
}

function backToForm() {
  step.value = 'form'
  error.value = ''
  code.value = []
  if (resendTimer) {
    clearInterval(resendTimer)
    resendIn.value = 0
  }
}
</script>

<template>
  <div class="min-h-dvh lg:grid lg:grid-cols-2">
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
          Become an Odoo implementation star, one session at a time.
        </h1>
        <p class="mt-4 leading-relaxed text-(--ui-text-muted)">
          The complete Partner Bootcamp — 27 sessions across 4 tracks — with live progress tracking and your deliverables in one place.
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
          <template v-if="step === 'form'">
            <h2 class="text-xl font-semibold tracking-tight text-(--ui-text-highlighted)">
              Welcome to the Bootcamp
            </h2>
            <p class="mt-1 text-sm text-(--ui-text-muted)">
              Enter your details and we will email you a one-time code to verify it is you.
            </p>

            <form
              class="mt-6 space-y-4"
              @submit.prevent="requestCode"
            >
              <UFormField
                label="Full name"
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
                label="Work email"
                description="Must be a @leadsagri.com address."
                required
              >
                <UInput
                  v-model="email"
                  type="email"
                  size="xl"
                  placeholder="juan@leadsagri.com"
                  autocomplete="email"
                />
              </UFormField>

              <UAlert
                v-if="error"
                :title="error"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
              />

              <UButton
                type="submit"
                block
                size="xl"
                :loading="loading"
              >
                Send verification code
              </UButton>
            </form>
          </template>

          <template v-else>
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-xl font-semibold tracking-tight text-(--ui-text-highlighted)">
                  Check your inbox
                </h2>
                <p class="mt-1 text-sm text-(--ui-text-muted)">
                  We sent a 6-digit code to
                  <span class="font-medium text-(--ui-text-highlighted)">{{ email }}</span>.
                  It expires in 5 minutes.
                </p>
              </div>
            </div>

            <div class="mt-6 flex justify-center">
              <UPinInput
                v-model="code"
                :length="6"
                otp
                size="xl"
                :autofocus="true"
                :disabled="loading"
                @complete="verifyCode"
              />
            </div>

            <UAlert
              v-if="error"
              :title="error"
              color="error"
              variant="subtle"
              icon="i-lucide-circle-alert"
              class="mt-4"
            />

            <UAlert
              v-if="devCode"
              title="Dev mode"
              :description="`No SMTP configured, so the code was not emailed. Your code is ${devCode}.`"
              color="info"
              variant="subtle"
              icon="i-lucide-flask-conical"
              class="mt-4"
            />

            <UButton
              block
              size="xl"
              class="mt-6"
              :loading="loading"
              :disabled="code.length !== 6"
              @click="verifyCode"
            >
              Verify code
            </UButton>

            <div class="mt-5 flex items-center justify-between text-sm">
              <UButton
                variant="link"
                color="neutral"
                size="sm"
                :disabled="resendIn > 0"
                @click="requestCode"
              >
                Resend code{{ resendIn > 0 ? ` in ${resendIn}s` : '' }}
              </UButton>
              <UButton
                variant="link"
                color="neutral"
                size="sm"
                @click="backToForm"
              >
                Change email
              </UButton>
            </div>
          </template>
        </UCard>

        <p class="mt-5 text-center text-xs text-(--ui-text-muted)">
          LeadsAgri · Odoo Partner Bootcamp Tracker
        </p>
      </div>
    </div>
  </div>
</template>
