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
        // Dark mode colors (Snapshot-inspired) - flattened for Tailwind utilities
        'dark-bg-primary': '#0f0f0f',
        'dark-bg-secondary': '#1a1a1a',
        'dark-bg-tertiary': '#262626',
        'dark-text-primary': '#ffffff',
        'dark-text-secondary': '#a3a3a3',
        // Light mode colors - flattened for Tailwind utilities
        'light-bg-primary': '#ffffff',
        'light-bg-secondary': '#f5f5f5',
        'light-bg-tertiary': '#e5e5e5',
        'light-text-primary': '#0f0f0f',
        'light-text-secondary': '#525252',
        // Brand colors
        brand: {
          primary: '#8b5cf6', // Purple
          accent: '#06b6d4',   // Cyan
        },
        // Status colors
        status: {
          success: '#10b981', // Green
          error: '#ef4444',    // Red
          warning: '#f59e0b',  // Yellow
          info: '#3b82f6',     // Blue
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

