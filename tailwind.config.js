/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1a1a2e',
          hover: '#16213e',
          active: '#0f3460',
        },
        accent: {
          DEFAULT: '#e94560',
          light: '#ff6b81',
        },
      },
    },
  },
  plugins: [],
}
