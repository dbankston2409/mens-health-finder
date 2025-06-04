/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        primary: '#FF3B3B',
        textPrimary: '#FFFFFF',
        textSecondary: '#AAAAAA',
        gray: {
          800: '#1F2937',
          900: '#111827',
          950: '#0A1020'}
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Work Sans', 'sans-serif']},
      animation: {
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.2s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'},
      keyframes: {
        slideDown: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }},
        slideUp: {
          '0%': { opacity: 1, transform: 'translateY(0)' },
          '100%': { opacity: 0, transform: 'translateY(-10px)' }},
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }}},
      backdropBlur: {
        xs: '2px'}}},
  plugins: [
    require('@tailwindcss/typography')]};