import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0820",
        foreground: "#ffffff",
        brand: {
          dark: "#1a1040",
          medium: "#2d1b69",
          accent: "#7F77DD",
          light: "#C4BEFF",
          success: "#1D9E75",
        }
      },
    },
  },
  plugins: [],
};
export default config;
