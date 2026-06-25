export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0a1f44", deep: "#06122b" },
        accent: { DEFAULT: "#00d2ff" },
      },
      fontFamily: {
        display: ['"Libre Baskerville"', "Georgia", "serif"],
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
