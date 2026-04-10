// assets/js/supabase-client.js
// Single source of truth for the Supabase client.
// Replace the two constants below with values from:
// Supabase Dashboard → Project Settings → API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://wqmnvmlvlpxlpucejmtz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbW52bWx2bHB4bHB1Y2VqbXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTQwNzEsImV4cCI6MjA5MTM5MDA3MX0.I-9bpGaVrK9XvRZuPskUcHfhkKoM7ABikb_gRMui6kk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
