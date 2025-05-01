// tailwind.config.js
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}", // adapt as needed
    ],
    theme: {
      extend: {
        fontFamily: {
          noto: ['"Noto Sans"', 'sans-serif'],
          rubik: ['"Rubik"', 'sans-serif'],
        },
      },
    },
    plugins: [],
  };
  