import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // YourStory Brand Colors
        brand: {
          orange: '#fd5f04',
          'orange-light': '#fe7d33',
          'orange-dark': '#dc5203',
          black: '#000000',
          white: '#ffffff',
          'gray-light': '#f5f5f5',
          'gray-medium': '#e0e0e0',
          'gray-dark': '#333333',
        },
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fe7d33',
          500: '#fd5f04', // Willpower Orange
          600: '#dc5203',
          700: '#c24603',
          800: '#9a3802',
          900: '#7c2d02',
        },
      },
      fontFamily: {
        sans: ['Lama Sans', 'var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Lama Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 4px 14px 0 rgba(253, 95, 4, 0.15)',
        'brand-lg': '0 10px 40px 0 rgba(253, 95, 4, 0.2)',
        'brand-xl': '0 20px 60px 0 rgba(253, 95, 4, 0.25)',
        'glow': '0 0 20px rgba(253, 95, 4, 0.3)',
        'glow-lg': '0 0 40px rgba(253, 95, 4, 0.4)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(253, 95, 4, 0.1)',
        'elegant': '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'elegant-lg': '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #fd5f04 0%, #fe7d33 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
