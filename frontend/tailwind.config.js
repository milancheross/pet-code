/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1F3B',
        teal: '#19B6B2',
        teal2: '#108A86',
        'teal-light': '#7DE0D6',
        orange: '#FF6B4A',
        'orange2': '#E85A39',
      },
      fontFamily: { sans: ['Manrope', 'ui-sans-serif', 'system-ui'] },
    },
  },
  plugins: [],
}
