import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        board: '#f8f1d7',
        yellow: '#f7c948',
        text: '#1f2937',
        accepted: '#1f8f5f',
        rejected: '#cc5b3a',
      },
      boxShadow: {
        soft: '0 8px 20px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
