/** @type {import('tailwindcss').Config} */

// NOT LOADING IN TAILWIND 4
// ALSO @config "../tailwind.config.js"; WORKS ONLY WITH CSS

module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts,css,scss}',
    './src/styles/**/*.{scss}',
  ],
  theme: {
    extend: {
      colors: {

      }
    }
  },
  plugins: [],
  important: false,
  corePlugins: {
    preflight: false,
  },
}