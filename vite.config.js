import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    headers: {
      'Cache-Control': 'no-store',
    },
    // Translation scripts rewrite 133 language files; don't reload the open app for each one.
    // New translations load on the next page load.
    watch: {
      ignored: ['**/src/i18n/locales/**'],
    },
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
})
