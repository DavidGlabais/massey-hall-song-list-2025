import { supabase } from "./supabaseClient"
import type { DatabaseSong } from "./supabaseClient"

// Song service for database operations
export class SongService {
  // Get all songs from database
  static async getAllSongs(): Promise<DatabaseSong[]> {
    try {
      console.debug("[DEBUG] SongService.getAllSongs() called");
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("id", { ascending: true })
      
      if (error) throw error
      console.debug("[DEBUG] getAllSongs retrieved:", data?.length, "songs, first song pdf_url:", data?.[0]?.pdf_url);
      return data || []
    } catch (error) {
      console.error("Error fetching songs:", error)
      return []
    }
  }

  // Save/update a song
  static async saveSong(song: DatabaseSong): Promise<boolean> {
    try {
      console.debug("[DEBUG] SongService.saveSong() called for id", song.id, "with pdf_url:", song.pdf_url);
      const { error } = await supabase
        .from("songs")
        .upsert({
          id: song.id,
          title: song.title,
          duration: song.duration,
          players: song.players,
          pdf_url: song.pdf_url,
          pdf_urls: song.pdf_urls,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      return true
    } catch (error) {
      console.error("Error saving song:", error)
      return false
    }
  }

  // Save all songs at once (for initial setup/migration)
  static async saveAllSongs(songs: DatabaseSong[]): Promise<boolean> {
    try {
      console.debug("[DEBUG] SongService.saveAllSongs() called for", songs.length, "songs");
      const { error } = await supabase
        .from("songs")
        .upsert(songs.map(song => ({
          id: song.id,
          title: song.title,
          duration: song.duration,
          players: song.players,
          pdf_url: song.pdf_url,
          updated_at: new Date().toISOString()
        })))
      
      if (error) throw error
      return true
    } catch (error) {
      console.error("Error saving all songs:", error)
      return false
    }
  }

  // Subscribe to real-time changes
  static subscribeToChanges(callback: (songs: DatabaseSong[]) => void) {
    const subscription = supabase
      .channel("songs-changes")
      .on("postgres_changes", 
          { event: "*", schema: "public", table: "songs" }, 
          async (payload) => {
            const songs = await this.getAllSongs()
            callback(songs)
          }
      )
      .subscribe()

    return subscription
  }

  // Upload a PDF file and return its URL
  static async uploadPdf(file: File, songId: number): Promise<string | null> {
    try {
      console.debug("[DEBUG] Starting PDF upload for songId:", songId, "filename:", file.name);
      const fileExt = file.name.split(".").pop()
      const fileName = `${songId}_${Date.now()}.${fileExt}`
      const filePath = `song-files/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("song-files")
        .upload(filePath, file)

      if (uploadError) throw uploadError
      console.debug("[DEBUG] File uploaded successfully to path:", filePath);

      const { data: { publicUrl } } = supabase.storage
        .from("song-files")
        .getPublicUrl(filePath)

      console.debug("[DEBUG] Generated public URL:", publicUrl);
      return publicUrl
    } catch (error) {
      console.error("Error uploading PDF:", error)
      return null
    }
  }
}
