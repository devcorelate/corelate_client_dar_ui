import type { Config } from 'tailwindcss';
import flowbite from 'flowbite/plugin';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/flowbite-react/dist/**/*.js',
    './node_modules/flowbite/dist/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        dar: '#007a3d',
      },
    },
  },
  plugins: [flowbite],
};

export default config;
