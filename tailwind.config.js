/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Это заставит Tailwind смотреть внутрь вашего App.tsx
  ],
  theme: {
    extend: {
      // Добавим анимацию pop, которая есть в вашем коде
      animation: {
        pop: 'pop 0.3s ease-out',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}