import scrollbar from 'tailwind-scrollbar'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-red-300/50',
    'bg-blue-300/50',
    'bg-purple-300/50',
    'bg-orange-300/50',
	'bg-gray-300/50',
	'bg-lime-300/50',
	'bg-yellow-300/50', 
	'bg-green-300/50', 
	'bg-teal-300/50', 
	'bg-indigo-300/50', 
	'bg-pink-300/50', 
	'bg-rose-300/50', 
	'bg-stone-300/50',
    'bg-red-300',
    'bg-blue-300',
    'bg-purple-300',
    'bg-orange-300',
	'bg-gray-300',
	'bg-lime-300',
	'bg-yellow-300', 
	'bg-green-300', 
	'bg-teal-300', 
	'bg-indigo-300', 
	'bg-pink-300', 
	'bg-rose-300', 
	'bg-stone-300'
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			noto: [
  				'"Noto Sans"',
  				'sans-serif'
  			],
  			rubik: [
  				'"Rubik"',
  				'sans-serif'
  			],
  			jetbrains: [
  				'"JetBrains Mono"',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			xxs: '0.65rem'
  		},
  		colors: {
  			light: '#464646',
  			backgroundDark: '#282828',
  			fadedWhite: 'rgba(255, 255, 255, 0.7)',
  			midWhite: 'rgba(255, 255, 255, 0.4)',
  			faintWhite: 'rgba(255, 255, 255, 0.2)',
  			lmBackground: '#EDEFF1',
  			lmMidBackground: '#E5E7EA',
  			lmLightBackground: '#FFFFFF',
  			fadedBlack: 'rgba(0, 0, 0, 0.7)',
  			midBlack: 'rgba(0, 0, 0, 0.4)',
  			faintBlack: 'rgba(0, 0, 0, 0.2)',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		boxShadow: {
			'bottom-grey': '0 4px 4px -2px rgba(0, 0, 0, 0.05)',
		},
  	}
  },
  plugins: [scrollbar(), require("tailwindcss-animate")],
}

