/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink:    { DEFAULT: '#1a1a1a', soft: '#3d3d3d', muted: '#737373' },
        paper:  { DEFAULT: '#fdfcf9', warm:  '#f5f3ee', card: '#ffffff' },
        accent: { DEFAULT: '#b85c38', dark:  '#8f4429', soft: '#fdf0eb' },
        gold:   { DEFAULT: '#c9963a', soft:  '#fdf5e4' },
        green:  { DEFAULT: '#2d6a4f', soft:  '#e8f4ee' },
        blue:   { DEFAULT: '#1d5fa8', soft:  '#e8f0fb' },
        border: '#e8e4dc',
        'border-strong': '#cdc8be',
      },
      screens: { xs: '375px' },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
    },
  },
  plugins: [],
};
