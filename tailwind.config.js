/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#059669", // emerald-600
          hover: "#047857",   // emerald-700
          light: "#ecfdf5",   // emerald-50
        },
        accent: {
          DEFAULT: "#f59e0b", // amber-500
          dark: "#d97706",    // amber-600
        },
        slate: {
          850: "#1e293b",
          950: "#0f172a",
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'subtle-bounce': 'subtleBounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        subtleBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
      borderRadius: {
        container: "1rem",
        xl: "1.5rem",
      },
    },
  },
  plugins: [],
};
