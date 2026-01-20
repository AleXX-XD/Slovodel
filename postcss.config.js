export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-preset-env': {
      stage: 1,
      features: {
        'oklch-function': { preserve: false }, // Принудительно заменять oklch на rgb
        'color-mix': { preserve: false },      // Заменять color-mix
      }
    },
    'autoprefixer': {},
  },
}