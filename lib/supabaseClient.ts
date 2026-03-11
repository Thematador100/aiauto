// Supabase Client with Built-in Authentication
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig, isSupabaseConfigured } from '../config/supabase';

// Create Supabase client (will use placeholder if env vars missing)
export const supabase: SupabaseClient = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Auth helper functions with error handling
export const auth = {
  // Sign up new user
  async signUp(email: string, password: string, metadata?: any) {
    if (!isSupabaseConfigured) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please contact administrator.' } 
      };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please contact administrator.' } 
      };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      return { user: null, error: null };
    }
    
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  async getSession() {
    if (!isSupabaseConfigured) {
      return { session: null, error: null };
    }
    
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    
    return supabase.auth.onAuthStateChange(callback);
  },
};
