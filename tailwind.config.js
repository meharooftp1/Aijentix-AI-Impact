/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Card / content surfaces — pure white.
        paper: "#FFFFFF",
        // Page background — a whisper of frost blue so white cards read as
        // surfaces lifted off the page, not just white-on-white.
        canvas: "#F3F7FC",
        // Text — deep navy instead of neutral gray, so even body copy sits
        // inside the blue family.
        ink: "#0E1F3C",
        // Hairlines / dividers.
        ledger: "#D9E3F2",
        // Primary — a confident, slightly ink-leaning blue used for the
        // sidebar, headings, and primary data (was "teal" in earlier passes;
        // class names like bg-teal / text-teal are unchanged).
        teal: {
          DEFAULT: "#123A73",
          light: "#E4ECF9",
          dark: "#0A2650",
        },
        // Secondary — a clear, brighter royal blue for links, secondary data
        // series (e.g. "Target" scores), and secondary actions.
        amber: {
          DEFAULT: "#2F6FE4",
          light: "#E3ECFD",
        },
        // Tertiary/muted — used sparingly for hover states on destructive
        // actions (remove/delete). Deliberately still blue-family, not red,
        // to keep the palette strictly two-tone as requested.
        clay: {
          DEFAULT: "#3A5A96",
          light: "#EDF2FA",
        },
      },
      fontFamily: {
        // Brand type system, matching aijentix.com:
        // Syne for display/headings, IBM Plex Sans for body, JetBrains Mono for labels.
        display: ["Syne", "Avenir Next", "Segoe UI", "sans-serif"],
        sans: ["IBM Plex Sans", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
