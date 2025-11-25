import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ihwmsjfnpirlfcuptima.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlod21zamZucGlybGZjdXB0aW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzM3MTEsImV4cCI6MjA3NjA0OTcxMX0.ypLuY922CoMxsoTMpZb8BEYRU9jusHVrDYpp_aMx3R4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});