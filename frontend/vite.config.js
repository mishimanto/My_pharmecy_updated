import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function vendorChunk(id) {
  if (!id.includes('node_modules')) {
    return null
  }

  if (id.includes('react-dom') || id.includes('react/jsx-runtime') || id.includes('/react/')) {
    return 'react-core'
  }

  if (id.includes('react-router-dom') || id.includes('@tanstack/react-query')) {
    return 'routing-data'
  }

  if (id.includes('axios')) {
    return 'network'
  }

  if (id.includes('chart.js')) {
    return 'charts'
  }

  if (id.includes('swiper') || id.includes('@lottiefiles') || id.includes('react-icons')) {
    return 'ui-vendor'
  }

  if (id.includes('sweetalert2') || id.includes('react-hot-toast')) {
    return 'feedback'
  }

  return 'vendor'
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
})
