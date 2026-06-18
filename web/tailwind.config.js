/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#9E9E9E", // Global Neutral Gray
        surface: "#FFFFFF",    // Pure White
        primary: "#000000",    // Solid Black
        secondary: "#9E9E9E",  // Medium Gray
        border: "#E5E7EB",     // Light Gray for borders
        accent: "#7C3AED",     // Violet / Purple
      },
      borderRadius: {
        'sharp': '8px',
        'soft': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
