// config.template.js - Template for configuration
// This file is committed to git
// Copy this to config.js and fill in your local credentials
const CONFIG = {
  // Replace these with your actual Supabase credentials
  SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',

  // Other config
  CRUISE_PASSWORD: "divas2025",
  CRUISE_DATE: new Date("October 6, 2025 15:30:00")
};

// Make config available globally
window.CRUISE_CONFIG = CONFIG;