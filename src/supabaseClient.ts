import { createClient } from '@supabase/supabase-js'

// Hardcoded values for testing
const supabaseUrl = 'https://egzkebenixuehgettjoq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnemtlYmVuaXh1ZWhnZXR0am9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzY5OTMsImV4cCI6MjA3MTIxMjk5M30.IPctwsarK__KKkU9DBq2cJ5iZ_0W4nzNNrCojriRV_c'

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
  pdf_url?: string | null;  // Single PDF URL field matching database schema
  has_string_arrangement?: boolean;
  has_horn_arrangement?: boolean;
  created_at?: string;
  updated_at?: string;
  tempo?: string;
  groove?: string;
}