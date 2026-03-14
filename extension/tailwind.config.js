/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#355872",
          hover: "#7AAACE",
          light: "#9CD5FF",
        },
        background: "#F7F8F0",
      },
    },
  },
  plugins: [],
};
