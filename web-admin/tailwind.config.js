/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3366FF',
          light: '#D6E4FF',
          dark: '#1e40af',
        },
        admin: {
          DEFAULT: '#7C3AED',
          light: '#EDE9FE',
          dark: '#5B21B6',
        },
      },
    },
  },
  plugins: [],
}

