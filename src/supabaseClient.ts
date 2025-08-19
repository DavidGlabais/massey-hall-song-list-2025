import { createClient } from '@supabase/supabase-js'

// These will be your Supabase project credentials
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DatabaseSong {
  id: number;
  title: string;
  duration: string;
  players: {
    electricGuitar: string[];
    acousticGuitar: string[];
    bass: string[];
    vocals: string[];
    backupVocals: string[];
  };
  created_at?: string;
  updated_at?: string;
}
