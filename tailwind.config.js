/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Earthy/Clinical Palette (Amaha-inspired)
                cream: '#FDFBF7',
                moss: {
                    50: '#f2f7f4',
                    100: '#e1ede6',
                    200: '#c5dbc9',
                    600: '#4b7c5b',
                    700: '#3d634a',
                    800: '#32513d',
                    900: '#1a2e22', // Dark text replacement
                },
                sage: {
                    50: '#f4f7f5',
                    100: '#e3ebe7',
                    200: '#c8dcd2',
                    500: '#84a98c',
                    600: '#52796f',
                },
                // Soft/Social Palette (NEMA-inspired)
                soft: {
                    blue: '#E0F4FF',
                    pink: '#FFE4E6',
                    purple: '#F3E8FF',
                },
                primary: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'], // If available, else falls back
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 15px rgba(132, 169, 140, 0.4)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
