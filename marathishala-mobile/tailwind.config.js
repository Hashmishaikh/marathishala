/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#080d1a',
        card: '#0f172a',
        primary: '#38bdf8',
        secondary: '#0284c7',
        accent: '#fbbf24',
        wicket: '#e11d48',
      },
    },
  },
  plugins: [],
};
