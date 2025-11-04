// design/tokens/tailwind.config.partial.js
// Example Tailwind config snippet showing how to bind Tailwind colors to CSS variables.
// Merge this into your project's tailwind.config.js via `theme.extend` or a merge step.

module.exports = {
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        primary: "var(--accent-1)",
        accentCyan: "var(--accent-cyan)",
        accentMint: "var(--accent-mint)",
        chart1: "var(--chart-1)",
        chart2: "var(--chart-2)",
        chart3: "var(--chart-3)",
        chart4: "var(--chart-4)",
        text: {
          DEFAULT: "var(--text-primary)",
          muted: "var(--text-secondary)"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"]
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)"
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        medium: "var(--motion-medium)"
      }
    }
  }
};