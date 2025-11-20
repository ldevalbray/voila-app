import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx,mdx}',
    './src/lib/**/*.{ts,tsx,mdx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		fontFamily: {
			sans: [
				'Funnelsans',
				'system-ui',
				'-apple-system',
				'BlinkMacSystemFont',
				'Segoe UI',
				'Roboto',
				'sans-serif'
			],
			mono: [
				'var(--font-commit-mono)',
				'ui-monospace',
				'SFMono-Regular',
				'monospace'
			],
			commit: [
				'var(--font-commit-mono)',
				'ui-monospace',
				'SFMono-Regular',
				'monospace'
			]
		},
  		fontSize: {
  			'display': ['4rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
  			'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
  			'h2': ['2rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],
  			'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
  			'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],
  			'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
  			'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
  			'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  			'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
  			'code': ['0.875rem', { lineHeight: '1.5', fontFamily: 'var(--font-commit-mono)' }],
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'slide-in-right-spring': {
  				'0%': {
  					transform: 'translateX(100%) scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0) scale(1)',
  					opacity: '1'
  				}
  			},
  			'slide-out-right-spring': {
  				'0%': {
  					transform: 'translateX(0) scale(1)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateX(100%) scale(0.95)',
  					opacity: '0'
  				}
  			},
  			'slide-in-right-center-spring': {
  				'0%': {
  					transform: 'translateX(calc(50vw + 100%)) translateY(-50%) scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(-50%) translateY(-50%) scale(1)',
  					opacity: '1'
  				}
  			},
  			'slide-out-right-center-spring': {
  				'0%': {
  					transform: 'translateX(-50%) translateY(-50%) scale(1)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateX(calc(50vw + 100%)) translateY(-50%) scale(0.95)',
  					opacity: '0'
  				}
  			},
  			'fade-in-blur': {
  				'0%': {
  					opacity: '0',
  					filter: 'blur(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					filter: 'blur(0)'
  				}
  			},
  			'fade-out-blur': {
  				'0%': {
  					opacity: '1',
  					filter: 'blur(0)'
  				},
  				'100%': {
  					opacity: '0',
  					filter: 'blur(10px)'
  				}
  			},
  			'shimmer': {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			},
  			'scale-in': {
  				'0%': {
  					transform: 'scale(0.9)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'slide-up-fade': {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'slide-in-right-spring': 'slide-in-right-spring 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  			'slide-out-right-spring': 'slide-out-right-spring 0.2s cubic-bezier(0.7, 0, 0.84, 0)',
  			'fade-in-blur': 'fade-in-blur 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  			'fade-out-blur': 'fade-out-blur 0.2s cubic-bezier(0.7, 0, 0.84, 0)',
  			'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  			'slide-up-fade': 'slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  			'shimmer': 'shimmer 2s infinite linear'
  		}
  	}
  },
  plugins: [],
}

export default config
