import type { Config } from 'tailwindcss';

export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Esmeralda — primária
        'emerald-950': '#022c22',
        'emerald-900': '#064e3b',
        'emerald-800': '#065f46',
        'emerald-700': '#047857',
        'emerald-600': '#059669',
        'emerald-500': '#10b981',
        'emerald-400': '#34d399',
        'emerald-300': '#6ee7b7',
        'emerald-200': '#a7f3d0',
        'emerald-100': '#d1fae5',
        'emerald-50': '#ecfdf5',
        // Neutros escuros
        'charcoal-900': '#0f172a',
        'charcoal-800': '#1e293b',
        'charcoal-700': '#334155',
        // Neutros claros
        'snow-50': '#f8fafc',
        'snow-100': '#f1f5f9',
        'snow-200': '#e2e8f0',
        'snow-300': '#cbd5e1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;