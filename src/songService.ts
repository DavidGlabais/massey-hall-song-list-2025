import { supabase } from './supabaseClient'
import type { DatabaseSong } from './supabaseClient'

// Song service for database operations
export class SongService {
  
  // Get all songs from database
  static async getAllSongs(): Promise<DatabaseSong[]> {
    try {
  console.debug('[DEBUG] SongService.getAllSongs() called');
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('id', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
  console.error('Error fetching songs:', error)
      return []
    }
  }

  // Save/update a song
  static async saveSong(song: DatabaseSong): Promise<boolean> {
    try {
  console.debug('[DEBUG] SongService.saveSong() called for id', song.id);
      const { error } = await supabase
        .from('songs')
        .upsert({
          id: song.id,
          title: song.title,
          duration: song.duration,
          players: song.players,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      return true
    } catch (error) {
  console.error('Error saving song:', error)
      return false
    }
  }

  // Save all songs at once (for initial setup/migration)
  static async saveAllSongs(songs: DatabaseSong[]): Promise<boolean> {
    try {
  console.debug('[DEBUG] SongService.saveAllSongs() called for', songs.length, 'songs');
      const { error } = await supabase
        .from('songs')
        .upsert(songs.map(song => ({
          id: song.id,
          title: song.title,
          duration: song.duration,
          players: song.players,
          updated_at: new Date().toISOString()
        })))
      
      if (error) throw error
      return true
    } catch (error) {
  console.error('Error saving all songs:', error)
      return false
    }
  }

  // Subscribe to real-time changes
  static subscribeToChanges(callback: (songs: DatabaseSong[]) => void) {
    console.debug('[DEBUG] SongService.subscribeToChanges() called');
    const subscription = supabase
      .channel('songs-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'songs' }, 
          async (payload) => {
            console.debug('[DEBUG] subscription event received', payload);
            // Fetch updated data when changes occur
            const songs = await this.getAllSongs()
            console.debug('[DEBUG] subscription fetched', songs.length, 'songs');
            callback(songs)
          }
      )
      .subscribe()

    return subscription
  }
}
