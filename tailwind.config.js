/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
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