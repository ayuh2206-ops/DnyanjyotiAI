import type { Config } from "tailwindcss";
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./views/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        primary: '#ec7f13',
        'primary-hover': '#d66e0a',
        dark: {
          900: '#0f0f11',
          800: '#15151a',
          700: '#1e1e24',
        }
      },
      backgroundImage: {
        'wallpaper': "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')",
      }
    },
  },
  plugins: [
    forms,
    containerQueries,
  ],
};
export default config;