/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        potros: {
          black: '#0b0b0b',
          white: '#ffffff',
          red: '#d62828'
        }
      }
    }
  },
  plugins: []
}
