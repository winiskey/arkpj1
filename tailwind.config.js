/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        sans: ["Noto Sans SC", "Segoe UI", "sans-serif"],
      },
      colors: {
        base: "#050507", // deeper, pure onyx black
        accent: "#d4be88", // champagne gold
        accentSoft: "#eaddbd", // lighter gold
        accentDark: "#a38b57", // muted gold
        mute: "#8a8d93", // neutral sophisticated grey
        electric: "#2a2d34", // dark graphite instead of bright purple
      },
      boxShadow: {
        glow: "0 0 15px rgba(212, 190, 136, 0.15)", // subtle gold glow
        glowStrong: "0 4px 24px rgba(212, 190, 136, 0.3)", // elegant focused shadow
        line: "0 0 8px rgba(255, 255, 255, 0.1)", // crisp line glow
        innerGlow: "inset 0 0 16px rgba(212, 190, 136, 0.08)",
      },
      backgroundImage: {
        scanline:
          "linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)", // very subtle
        'gradient-radial-glow': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'subtle-grid': 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)', // extremely faint, high perf
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 32s linear infinite',
        'spin-slower': 'spin 46s linear infinite reverse',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      },
      transitionTimingFunction: {
        'snappy': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        'snappy': '400ms',
      }
    },
  },
  plugins: [],
};
