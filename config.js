// config.js - Configuration for GitHub Pages deployment
const CONFIG = {
  // These placeholders will be replaced during GitHub Actions build
  SUPABASE_URL: 'REPLACE_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'REPLACE_SUPABASE_ANON_KEY',

  // Other config
  CRUISE_PASSWORD: "divas2025",
  CRUISE_DATE: new Date("October 6, 2025 15:30:00")
};

// Make config available globally
window.CRUISE_CONFIG = CONFIG;