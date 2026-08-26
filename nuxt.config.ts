// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    smtp: {
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from: ''
    }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    storage: {
      data: { driver: 'fs', base: './.data' }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
