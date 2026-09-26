/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#0B0C0E',
          surface: '#121417',
          elevated: '#181A1F',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(255, 255, 255, 0.04)',
          text: '#F3F4F6',
          muted: '#8A919E',
          dim: '#4B5361',
          accent: '#FF5A36', // Warm studio orange
          amber: '#F59E0B',  // Warm analog amber
          phosphor: '#E2E8F0', // Monochromatic crisp phosphor
          dark: '#08080A'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '12px', // STRICT: max 12px rounded corners as per spec
      }
    },
  },
  plugins: [],
}
