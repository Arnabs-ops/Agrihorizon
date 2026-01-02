/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#16a34a", // green-600
        "primary-hover": "#15803d", // green-700
        secondary: "#6b7280", // gray-500
      },
      spacing: {
        section: "2rem",
        container: "1rem",
      },
      borderRadius: {
        container: "0.5rem",
      },
    },
  },
  plugins: [],
};
