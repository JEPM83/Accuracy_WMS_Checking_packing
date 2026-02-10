/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Accuracy Brand Colors
        accuracy: {
          'light': '#81cff4',      // Azul claro
          'medium-light': '#69abde', // Azul medio claro
          'medium': '#2578b5',       // Azul medio
          'navy': '#00365f',         // Azul oscuro (principal)
          'gray': '#758c98',         // Gris azulado
        },
        primary: {
          50: '#e6f4fb',
          100: '#cce9f7',
          200: '#99d3ef',
          300: '#81cff4',  // accuracy-light
          400: '#69abde',  // accuracy-medium-light
          500: '#2578b5',  // accuracy-medium
          600: '#1e6392',
          700: '#174e70',
          800: '#0f394d',
          900: '#00365f',  // accuracy-navy
        },
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'bounce-slight': {
          '0%, 100%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(-10%)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slight': 'bounce-slight 0.5s ease-in-out 2',
      },
    },
  },
  plugins: [],
}
