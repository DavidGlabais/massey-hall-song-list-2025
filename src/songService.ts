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

  // Restore tempo and groove data from backup
  static async restoreTempoAndGroove(songUpdates: { id: number; tempo?: string; groove?: string; }[]): Promise<boolean> {
    try {
      console.debug("[DEBUG] Restoring tempo and groove data for", songUpdates.length, "songs");
      
      // First get all current songs to maintain their data
      const { data: currentSongs, error: fetchError } = await supabase
        .from("songs")
        .select("*")
        .in("id", songUpdates.map(u => u.id));
      
      if (fetchError) throw fetchError;
      if (!currentSongs) throw new Error("Could not fetch current songs");

      // Create a map for quick lookup
      const updateMap = new Map(songUpdates.map(u => [u.id, u]));
      
      // Update each song, maintaining existing data
      const { error } = await supabase
        .from("songs")
        .upsert(
          currentSongs.map(song => ({
            ...song, // Keep all existing data
            tempo: updateMap.get(song.id)?.tempo || song.tempo, // Update tempo if provided
            groove: updateMap.get(song.id)?.groove || song.groove, // Update groove if provided
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'id' }
        );
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error restoring tempo and groove data:", error);
      return false;
    }
  }

  // Save/update a song
  static async saveSong(song: DatabaseSong): Promise<boolean> {
    try {
      console.debug("[DEBUG] SongService.saveSong() called for id", song.id);
      
      // Validate required fields
      if (!song.id || !song.title || !song.duration || !song.players) {
        console.error("[ERROR] Missing required fields:", {
          hasId: !!song.id,
          hasTitle: !!song.title,
          hasDuration: !!song.duration,
          hasPlayers: !!song.players
        });
        return false;
      }
      
      console.debug("[DEBUG] Full song data:", JSON.stringify(song, null, 2));
      
      // Build the data object with only the fields we want to update
      const songData = {
        id: song.id,
        title: song.title,
        duration: song.duration,
        players: song.players,
        pdf_url: song.pdf_url || null,  // Using the correct column name
        has_string_arrangement: song.has_string_arrangement || false,
        has_horn_arrangement: song.has_horn_arrangement || false,
        tempo: song.tempo || null,
        groove: song.groove || null,
        updated_at: new Date().toISOString()
      };
      
      console.debug("[DEBUG] Calling Supabase upsert with data:", {
        table: "songs",
        data: songData,
        method: "upsert"
      });
      const { error } = await supabase
        .from("songs")
        .upsert(songData, { 
          onConflict: "id"
        })
      
      if (error) {
        console.error("[ERROR] Supabase upsert failed:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Log the full songData that caused the error
        console.error("[ERROR] Failed data:", songData);
        throw error;
      }
      console.debug("[DEBUG] Supabase upsert successful");
      return true;
    } catch (error: any) {
      console.error("[ERROR] Error saving song:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response,
        statusCode: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data
      });
      return false;
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
          has_string_arrangement: song.has_string_arrangement || false,
          has_horn_arrangement: song.has_horn_arrangement || false,
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
