/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1565C0', light: '#1976D2', dark: '#0D47A1' }
      }
    }
  },
  plugins: []
}
