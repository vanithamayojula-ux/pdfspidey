/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        m3: {
          surface: "#f4f4f5",
          "surface-container": "#e4e4e7",
          primary: "#18181b",
          "on-primary": "#ffffff",
          secondary: "#71717a",
          "on-secondary": "#ffffff",
          error: "#ef4444",
        },
      },
    },
  },
  plugins: [],
}
