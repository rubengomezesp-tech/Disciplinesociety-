// assets/js/supabase-client.js
// Single source of truth for the Supabase browser client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.107.0';

const runtimeConfig = window.DS_CONFIG || {};
const SUPABASE_URL = runtimeConfig.supabaseUrl || 'https://hobivwqzxytzgajgczxn.supabase.co';
const SUPABASE_ANON_KEY = runtimeConfig.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYml2d3F6eHl0emdhamdjenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTMxODMsImV4cCI6MjA5NjA2OTE4M30.KCUbo7eqjBRU76V8NqIUl7rCWGQmmUxiLwfilgg7Ls8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
