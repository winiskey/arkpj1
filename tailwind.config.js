/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        title: ["Noto Serif SC", "Source Han Serif SC", "serif"],
        display: ["Rajdhani", "sans-serif"],
        sans: ["Noto Sans SC", "Segoe UI", "sans-serif"],
      },
      colors: {
        canvas: "#070809",
        surface1: "#111317",
        surface2: "#171b20",
        surface3: "#20252d",
        strokeSoft: "#2a2f36",
        strokeStrong: "#434a55",
        text1: "#f4efe5",
        text2: "#b9b2a6",
        text3: "#7c766b",
        brand: "#d6c08a",
        brandStrong: "#e7d7ad",
        brandMuted: "#9f8653",
        live: "#c75b47",
        base: "#070809",
        accent: "#d6c08a",
        accentSoft: "#e7d7ad",
        accentDark: "#9f8653",
        mute: "#7c766b",
        electric: "#20252d",
      },
      boxShadow: {
        panel: "0 18px 40px -22px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
        panelLift: "0 24px 64px -28px rgba(0, 0, 0, 0.92), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        brand: "0 12px 32px -16px rgba(214, 192, 138, 0.42)",
        brandStrong: "0 20px 48px -24px rgba(214, 192, 138, 0.56)",
        glow: "0 12px 32px -18px rgba(214, 192, 138, 0.42)",
        glowStrong: "0 18px 48px -24px rgba(214, 192, 138, 0.56)",
        innerGlow: "inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 0 0 1px rgba(214, 192, 138, 0.08)",
      },
      backgroundImage: {
        "hero-veil": "radial-gradient(circle at top, rgba(214, 192, 138, 0.12), transparent 58%)",
        "subtle-grid": "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 3.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 48s linear infinite",
        "spin-slower": "spin 72s linear infinite reverse",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      transitionTimingFunction: {
        snappy: "cubic-bezier(0.16, 1, 0.3, 1)",
        fluid: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        snappy: "420ms",
      },
    },
  },
  plugins: [],
};
