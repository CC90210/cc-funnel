import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0a0a0a",
          dark: "#141414",
          card: "#1a1a1a",
          border: "#2a2a2a",
          cream: "#faf9f5",
          accent: "#e8c547",
          muted: "#888888",
        },
      },
    },
  },
  plugins: [],
};
export default config;
