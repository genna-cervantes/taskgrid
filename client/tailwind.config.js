import scrollbar from 'tailwind-scrollbar'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        noto: ['"Noto Sans"', 'sans-serif'],
        rubik: ['"Rubik"', 'sans-serif'],
        jetbrains: ['"JetBrains Mono"', 'sans-serif']
      },
      fontSize: {
        xxs: '0.5rem',
      },
      colors: {
        light: "#464646",
        backgroundDark: "#282828",
        fadedWhite: "rgba(255, 255, 255, 0.7)",
        midWhite: "rgba(255, 255, 255, 0.4)",
        faintWhite: "rgba(255, 255, 255, 0.2)",

        // light mode,
        lmBackground: "#EDEFF1", 
        lmMidBackground: "#E5E7EA",
        lmLightBackground: "#FFFFFF",
        fadedBlack: "rgba(0, 0, 0, 0.7)",
        midBlack: "rgba(0, 0, 0, 0.4)",
        faintBlack: "rgba(0, 0, 0, 0.2)",
      },
    },
  },
  plugins: [scrollbar()],
}

