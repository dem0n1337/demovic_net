export default defineNuxtConfig({
  compatibilityDate: '2026-08-18',
  devtools: { enabled: false },

  modules: ['@nuxtjs/google-fonts'],

  googleFonts: {
    families: {
      'JetBrains Mono': {
        wght: [400, 500, 700],
        ital: [400],
      },
    },
    display: 'swap',
    download: true,
  },

  runtimeConfig: {
    // Overridden at runtime via NUXT_SMTP_SERVER / NUXT_SMTP_USER /
    // NUXT_SMTP_PASS / NUXT_NOTIFY_STORE_PATH (docker-compose maps the
    // kvp-style SMTP_* names from .env onto these).
    smtpServer: '',
    smtpUser: '',
    smtpPass: '',
    notifyStorePath: '/data/notify-signups.jsonl',
    public: {
      // NUXT_PUBLIC_SITE_MODE: 'coming-soon' (HTTP 200, indexable)
      // or 'maintenance' (HTTP 503 + Retry-After)
      siteMode: 'coming-soon',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'demovic.net — coming soon',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'demovic.net is compiling. Websites & web apps — built and kept running. Launching soon.',
        },
        { name: 'theme-color', content: '#040608' },
        { property: 'og:title', content: 'demovic.net — coming soon' },
        {
          property: 'og:description',
          content:
            'demovic.net is compiling. Websites & web apps — built and kept running. Launching soon.',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://demovic.net' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'canonical', href: 'https://demovic.net' },
        { rel: 'preload', as: 'image', href: '/tux-panic-green.png' },
      ],
    },
  },
})
