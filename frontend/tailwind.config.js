/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { navy: '#1a2d4a', teal: '#3dbfb8', teal2: '#2fa89f' },
      fontFamily: { sans: ['Nunito', 'ui-sans-serif', 'system-ui'] },
    },
  },
  plugins: [],
}
