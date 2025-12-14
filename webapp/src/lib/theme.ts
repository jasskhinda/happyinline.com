// Happy InLine - Theme Configuration
// Centralized color system for consistent styling across the app

export const colors = {
  // Primary Background Colors
  primary: {
    dark: '#0a254a',      // Main page background (deep navy)
    DEFAULT: '#0d3a6b',   // Cards, sections (lighter navy)
    light: '#124b85',     // Hover states, lighter sections
  },

  // Brand Colors (Buttons, Links, Accents)
  brand: {
    DEFAULT: '#0393d5',   // Primary brand blue
    hover: '#027bb5',     // Button hover state
    light: '#00D4FF',     // Accents, gradients
    muted: '#0393d5/50',  // Muted brand color
  },

  // Surface Colors (Cards, Modals, Inputs)
  surface: {
    card: 'rgba(255, 255, 255, 0.1)',      // Glass card background
    cardHover: 'rgba(255, 255, 255, 0.15)', // Card hover state
    input: 'rgba(255, 255, 255, 0.1)',      // Input background
    modal: '#0d3a6b',                        // Modal background
    header: 'rgba(255, 255, 255, 0.9)',     // Header background
    footer: 'rgba(255, 255, 255, 0.9)',     // Footer background
  },

  // Border Colors
  border: {
    light: 'rgba(255, 255, 255, 0.2)',  // Light border
    DEFAULT: 'rgba(255, 255, 255, 0.1)', // Default border
    dark: 'rgba(0, 0, 0, 0.1)',          // Dark border (for light bg)
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',           // Primary text (white)
    secondary: '#0393d5',         // Secondary text (brand blue)
    muted: '#86868B',             // Muted/gray text
    dark: '#1a1a1a',              // Dark text (for light backgrounds)
    darkMuted: '#6b7280',         // Muted dark text
  },

  // Status Colors
  status: {
    success: '#22c55e',
    successBg: 'rgba(34, 197, 94, 0.2)',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.2)',
    warning: '#eab308',
    warningBg: 'rgba(234, 179, 8, 0.2)',
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.2)',
  },
} as const;

// Gradient presets
export const gradients = {
  // Page background gradient
  pageBg: 'bg-gradient-to-br from-[#0a254a] via-[#0d3a6b] to-[#0a254a]',

  // Hero section with glow
  heroGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(3, 147, 213, 0.3), transparent)',

  // Button gradient
  buttonGradient: 'bg-gradient-to-r from-[#0393d5] to-[#027bb5]',

  // Card gradient
  cardGradient: 'bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.05)]',

  // Text gradient (for headings)
  textGradient: 'bg-gradient-to-b from-white to-[#A1A1A6] bg-clip-text text-transparent',
} as const;

// Shadow presets
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  brand: '0 4px 14px 0 rgba(3, 147, 213, 0.3)', // Blue glow shadow
  headerUp: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)', // Shadow going up (for footer)
} as const;

// Common component styles
export const componentStyles = {
  // Buttons
  button: {
    primary: 'bg-[#0393d5] hover:bg-[#027bb5] text-white font-medium px-6 py-3 rounded-full transition-all hover:shadow-lg',
    secondary: 'bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-full transition-all border border-white/20',
    outline: 'bg-transparent border border-white/30 hover:bg-white/10 text-white font-medium px-6 py-3 rounded-full transition-all',
    danger: 'bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg transition-all',
  },

  // Cards
  card: {
    glass: 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20',
    solid: 'bg-[#0d3a6b] rounded-2xl border border-white/20',
    hover: 'hover:border-[#0393d5]/50 hover:shadow-lg transition-all',
  },

  // Inputs
  input: {
    default: 'w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5] focus:border-transparent transition-all',
    withIcon: 'w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0393d5] focus:border-transparent transition-all',
  },

  // Badges
  badge: {
    success: 'bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-sm',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-sm',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-sm',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-sm',
    brand: 'bg-[#0393d5]/20 text-[#0393d5] border border-[#0393d5]/30 px-3 py-1 rounded-full text-sm',
  },
} as const;

// Export type for TypeScript support
export type ThemeColors = typeof colors;
export type ThemeGradients = typeof gradients;
export type ThemeShadows = typeof shadows;
export type ThemeComponentStyles = typeof componentStyles;
