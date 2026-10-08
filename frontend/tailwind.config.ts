import type { Config } from "tailwindcss";

const GOLD = {
  50: "#FFF9EC",
  100: "#FDEFD0",
  200: "#F9E0A3",
  300: "#F4D58A", // gold-hi
  400: "#F4BF61",
  500: "#F2AA34", // gold (logo amber)
  600: "#C98A22",
  700: "#9A6B1E", // gold-lo
  800: "#7A5418",
  900: "#5C3F12",
  950: "#33220A",
};
const SAPPHIRE = {
  50: "#EAF3FB",
  100: "#D5E7F6",
  200: "#B0D3EC",
  300: "#8CC0E2",
  400: "#6DB1D8", // sapphire-hi (link, success)
  500: "#0880F0", // sapphire
  600: "#1050D0", // sapphire-lo
  700: "#0E43AE",
  800: "#0B3380",
  900: "#082457",
  950: "#051739",
};
const DANGER = {
  50: "#FBEFED",
  100: "#F6DAD6",
  200: "#EDB5AD",
  300: "#E08C80",
  400: "#D26A5C",
  500: "#C0463A", // danger
  600: "#A53A30",
  700: "#862E26",
  800: "#68241E",
  900: "#4B1A16",
  950: "#2A0E0B",
};
const NEUTRAL = {
  50: "#F4F5F6", // paper
  100: "#E8EAEC", // platinum
  200: "#D6D9DC",
  300: "#B8BCC0",
  400: "#A0A3A8", // platinum-lo
  500: "#8E9196",
  600: "#55575C",
  700: "#34363B",
  800: "#17171B",
  900: "#0B0B0D",
  950: "#050505",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand tokens (Figma "DZ Prime Academy: Redesign" > Foundations). Values come from CSS vars in globals.css (Black and Light modes).
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--line)",
        accent: "var(--accent)",
        "on-accent": "var(--on-accent)",
        muted: "var(--text-muted)",
        // Logo palette only. Every legacy Tailwind family is remapped below so old class names resolve to brand colours.
        gold: GOLD,
        amber: GOLD,
        yellow: GOLD,
        lime: GOLD,
        orange: GOLD,
        sapphire: SAPPHIRE,
        blue: SAPPHIRE,
        sky: SAPPHIRE,
        cyan: SAPPHIRE,
        indigo: SAPPHIRE,
        violet: SAPPHIRE,
        purple: SAPPHIRE,
        fuchsia: SAPPHIRE,
        emerald: SAPPHIRE,
        green: SAPPHIRE,
        teal: SAPPHIRE,
        rose: DANGER,
        red: DANGER,
        pink: DANGER,
        slate: NEUTRAL,
        gray: NEUTRAL,
        zinc: NEUTRAL,
        neutral: NEUTRAL,
        stone: NEUTRAL,
        navy: {
          50: "#F0F4FD",
          100: "#E1EBFA",
          200: "#C7DAF6",
          300: "#A1C1EF",
          400: "#729FE6",
          500: "#4D7FDC",
          600: "#3663CF",
          700: "#021A46", // brand navy field
          800: "#17171B", // surface-2
          850: "#111114", // surface
          900: "#0B0B0D", // ink
          950: "#050505", // black
        },
        dzBlue: {
          DEFAULT: "#1050D0",
          light: "#0880F0",
          dark: "#021A46",
          neon: "#6DB1D8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "serif"],
        // Arabic never renders in a monospace face: Latin digits/codes use the system mono, Arabic falls through to the UI font.
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "var(--font-sans)", "monospace"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(#F2AA34, #F2AA34)",
        "gold-metallic": "linear-gradient(#F2AA34, #F2AA34)",
        "card-dark": "linear-gradient(#111114, #111114)",
        "radial-glow": "none",
      },
      boxShadow: {
        "gold-glow": "0 1px 2px rgba(0,0,0,0.25)",
        "gold-glow-lg": "0 4px 12px -4px rgba(0,0,0,0.35)",
        "blue-glow": "0 1px 2px rgba(0,0,0,0.25)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2.5s infinite linear",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
