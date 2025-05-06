/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html', 
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './admin/**/*.{js,ts,jsx,tsx}',
    './shared/**/*.{js,ts,jsx,tsx,css}'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['Garamond', 'Georgia', 'serif'],
        sans: ['Helvetica', 'Arial', 'sans-serif'],
      },
      // Adjusted screen breakpoints to better target mobile devices
      screens: {
        'xs': '360px',    // Small phones
        'sm': '480px',    // Phones
        'md': '768px',    // Tablets
        'lg': '1024px',   // Laptops/Desktops
        'xl': '1280px',   // Large Desktops
        '2xl': '1536px',  // Extra Large Screens
      },
      // Add spacing for safe areas on mobile
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Add touch target sizing
      minHeight: {
        'touch': '44px',  // Minimum recommended touch target size
      },
      minWidth: {
        'touch': '44px',  // Minimum recommended touch target size
      },
    },
  },
  plugins: [],
};