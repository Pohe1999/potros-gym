/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        potros: {
          black:   '#050709',
          surface: '#0a0d13',
          card:    '#0e1219',
          border:  'rgba(255,255,255,0.08)',
          red:     '#d62828',
          'red-bright': '#e53935',
          'red-light':  '#ff5252',
          'red-dim':    '#7a1a1a',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      backgroundImage: {
        'red-glow-radial':  'radial-gradient(ellipse, rgba(214,40,40,0.35) 0%, transparent 65%)',
        'surface-gradient': 'linear-gradient(135deg, #0a0d13 0%, #050709 100%)',
      },
      animation: {
        'fade-in':      'fadeIn 0.25s ease-out',
        'scale-in':     'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up':     'slideUp 0.3s ease-out',
        'slide-down':   'slideDown 0.3s ease-out',
        'glow-pulse':   'glowPulse 2.5s ease-in-out infinite',
        'glow-pulse-fast': 'glowPulse 1.5s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'bounce-in':    'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'float':        'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        scaleIn:   { '0%': { opacity: 0, transform: 'scale(0.92)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        slideUp:   { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: 0, transform: 'translateY(-12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        bounceIn:  { '0%': { opacity: 0, transform: 'scale(0.7)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        float:     { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(214,40,40,0.3)' },
          '50%':      { boxShadow: '0 0 48px rgba(214,40,40,0.75), 0 0 80px rgba(214,40,40,0.25)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glass':          '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-hover':    '0 16px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
        'red-glow':       '0 0 36px rgba(214,40,40,0.6), 0 0 80px rgba(214,40,40,0.25)',
        'red-glow-sm':    '0 0 18px rgba(214,40,40,0.5)',
        'red-glow-xs':    '0 0 8px rgba(214,40,40,0.35)',
        'green-glow':     '0 0 24px rgba(34,197,94,0.5)',
        'amber-glow':     '0 0 24px rgba(245,158,11,0.45)',
        'sky-glow':       '0 0 24px rgba(56,189,248,0.45)',
        'inner-top':      'inset 0 1px 0 rgba(255,255,255,0.08)',
        'card':           '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
}
