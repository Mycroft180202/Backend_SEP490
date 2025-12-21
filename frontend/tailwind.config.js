const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        alata: ['Alata', ...fontFamily.sans],
        nunito: ['Nunito', ...fontFamily.sans],
        hoaico: ['Hoai-co', ...fontFamily.serif],
      },
      colors: {
        primary: '#9E211F',
        secondary: '#F0BE1D',
        background: '#FDFEEE',
        text: {
          DEFAULT: '#000000',
          gray: '#686868',
          light: '#A0A0A0',
        },
      },
    },
  },
  plugins: [],
}
