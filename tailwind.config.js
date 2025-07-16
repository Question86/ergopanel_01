/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'main-bg': '#181a23',
        'main-accent': '#21c4d6',
        'main-highlight': '#384061',
        'main-panel': '#1c1f2c'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 16px 0 #21c4d6',
      }
    },
  },
  plugins: [],
}
