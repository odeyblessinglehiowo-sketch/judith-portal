/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        apcGreen: "#008753",
        apcBlue: "#0087C8",
        apcRed: "#E03A3E",
      },
    },
  },
  plugins: [],
}