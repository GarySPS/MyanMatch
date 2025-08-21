module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Romantic MyanMatch Love/Dating Theme Colors
        'theme-primary':     '#FF5A5F',   // Vibrant pink-red (main brand)
        'theme-secondary':   '#EC4899',   // Warm magenta/pink (accents)
        'theme-tertiary':    '#A855F7',   // Playful purple (secondary accent)
        'theme-surface-pure':'#FFFFFF',   // Card/foregrounds
        'theme-n-8':         '#FFF1F2',   // Soft rose (background)
        'theme-stroke':      '#FBCFE8',   // Soft pink border
        'theme-yellow':      '#FDE68A',   // Warm yellow for highlights
        'theme-green':       '#34D399',   // Gentle green for "success"
        'theme-blue':        '#818CF8',   // Soft blue for info
        'theme-pink-100':    '#FCE7F3',   // Very light pink
        'theme-red-100':     '#FFE4E6',   // Soft red for alerts
        'theme-purple-100':  '#F3E8FF',   // Light purple backgrounds
        'theme-purple': '#A855F7',     // Vibrant purple (for border, icon, etc)
        'theme-purple-100': '#F3E8FF',// Soft/light purple (background, card)
        'theme-red':         '#FF3366',   // Button/alert red
        'theme-pink':        '#FF7CA3',   // Bright fun pink
        // “On-surface” shades for cards and subtle backgrounds
        'theme-on-surface-1': '#FFF1F2',
        'theme-on-surface-2': '#FCE7F3',
        'theme-on-surface-3': '#F3E8FF',
        'theme-border':      '#FBCFE8',
        'myanmatch-primary': '#E63929',
      },
    },
  },
  plugins: [],
}
