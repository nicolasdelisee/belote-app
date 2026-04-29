import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: '#1a4731',
          light: '#225e40',
          dark: '#12321f',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
