/**
 * Tailwind: design system BASECAMP (colori, font, radius).
 * Colori da globals.css, typography scale, safe-area per mobile.
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system — Apple-like Dark
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          hover: 'var(--surface-hover)',
          glass: 'var(--surface-glass)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          green: 'var(--accent-green)',
          red: 'var(--accent-red)',
          orange: 'var(--accent-orange)',
          purple: 'var(--accent-purple)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        separator: 'var(--separator)',
        // Section colors for tabs/badges
        section: {
          gym: 'var(--accent-red)',
          travels: 'var(--accent-blue)',
          thoughts: 'var(--accent-purple)',
          watchlist: 'var(--accent-orange)',
          moments: 'var(--accent-green)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '18px',
        xl: '22px',
        card: '18px',
        button: '14px',
        'bottom-sheet': '22px',
      },
      fontSize: {
        'display': ['32px', { lineHeight: '1.15', letterSpacing: '-0.03em' }],
        'title': ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'headline': ['20px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'body': ['16px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'callout': ['15px', { lineHeight: '1.45' }],
        'subhead': ['14px', { lineHeight: '1.4' }],
        'footnote': ['13px', { lineHeight: '1.4' }],
        'caption': ['12px', { lineHeight: '1.35' }],
      },
      minHeight: {
        'tap-target': '44px',
        button: '50px',
      },
      backdropBlur: {
        glass: '20px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
