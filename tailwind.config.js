const flowbite = require('flowbite/plugin');
const { createThemes } = require('tw-colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './node_modules/flowbite-react/**/*.{js,ts,jsx,tsx}',
    './node_modules/flowbite/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#003E70',
        secondary: '#a78bfa',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'ui-sans-serif', 'system-ui'],
        poppins: ['var(--font-poppins)', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [
    flowbite,
    createThemes({
      default: {
        primary: '#003E70',
        secondary: '#a78bfa',
      },
    }),
  ],
};
