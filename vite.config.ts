import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Используем стандартный минификатор, но с настройкой на старые браузеры
    target: 'es2015',
    cssTarget: ['chrome61', 'edge16', 'firefox60', 'safari11', 'ios11'],
  }
})
