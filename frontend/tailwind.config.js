/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0f172a", // Slate 900
        darkPanel: "#1e293b", // Slate 800
        primaryAccent: "#2563eb", // Royal Blue
        secondaryAccent: "#38bdf8", // Light Blue
      }
    },
  },
  plugins: [],
}
