/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'casa-teal': '#082C1B',
        'casa-gold': '#D4AF37',
        'casa-dark': '#111111',
        'casa-light': '#F9F9FB',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
