import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Plus, Download, Users, X, Trash2, Guitar, Mic, Database, Cloud, CloudOff, LogOut } from 'lucide-react';
import { SongService } from './songService';
import { supabase } from './supabaseClient';
import type { DatabaseSong } from './supabaseClient';
import { Notification } from './components/Notification';

// Define the Song type
interface Song {
  id: number;
  title: string;
  duration: string;
  interestedPlayers: string[]; // Keep existing for migration
  players?: {
    electricGuitar: string[];
    acousticGuitar: string[];
    bass: string[];
    vocals: string[];
    backupVocals: string[];
  };
  pdf_url?: string | null; // Keep for backward compatibility
  pdf_urls?: string[]; // New field for multiple PDFs
}

// Helper function to get all PDF URLs for a song (backward compatibility)
const getSongPdfUrls = (song: Song): string[] => {
  const urls: string[] = [];
  
  // Add URLs from new format
  if (song.pdf_urls && song.pdf_urls.length > 0) {
    urls.push(...song.pdf_urls);
  }
  
  // Add URL from legacy format if not already included
  if (song.pdf_url && !urls.includes(song.pdf_url)) {
    urls.push(song.pdf_url);
  }
  
  return urls;
};

// Helper function for database songs
const getDbSongPdfUrls = (song: DatabaseSong): string[] => {
  const urls: string[] = [];
  
  // Add URLs from new format
  if (song.pdf_urls && song.pdf_urls.length > 0) {
    urls.push(...song.pdf_urls);
  }
  
  // Add URL from legacy format if not already included
  if (song.pdf_url && !urls.includes(song.pdf_url)) {
    urls.push(song.pdf_url);
  }
  
  return urls;
};

// Helper function to check if there are meaningful changes between the current songs and updated songs
const checkForRealChanges = (currentSongs: any[], updatedSongs: any[]): boolean => {
  // If the number of songs is different, there's definitely a change
  if (currentSongs.length !== updatedSongs.length) {
    return true;
  }

  // Create a map of current songs by ID for easy comparison
  const currentSongsMap = new Map();
  currentSongs.forEach(song => {
    currentSongsMap.set(song.id, song);
  });

  // Check each updated song for differences
  for (const updatedSong of updatedSongs) {
    const currentSong = currentSongsMap.get(updatedSong.id);
    
    // If a song was added or removed, there's a change
    if (!currentSong) {
      return true;
    }
    
    // Check title and duration
    if (currentSong.title !== updatedSong.title || currentSong.duration !== updatedSong.duration) {
      return true;
    }

    // Check PDF URLs - if we have local PDF URLs, don't consider it a change from the server
    const currentPdfUrls = getSongPdfUrls(currentSong);
    const updatedPdfUrls = getSongPdfUrls(updatedSong);
    if (currentPdfUrls.length > 0 && updatedPdfUrls.length === 0) {
      return false;
    }
    
    // Check player assignments (more complex comparison)
    if (JSON.stringify(currentSong.players) !== JSON.stringify(updatedSong.players)) {
      return true;
    }
  }
  
  // No significant changes found
  return false;
};

interface SongDurationTrackerProps {
  userRole: 'viewer' | 'admin';
  onLogout: () => void;
}

const SongDurationTracker: React.FC<SongDurationTrackerProps> = ({ userRole, onLogout }) => {
  // Default songs to use if no saved data
  const defaultSongs: Song[] = [
    { id: 1, title: "Satellite of Love (Lou Reed) – Live Beck Version", duration: "3:37", interestedPlayers: [] },
    { id: 2, title: "After Midnight – JJ Cale", duration: "2:29", interestedPlayers: [] },
    { id: 3, title: "Reelin' in the Years – Steely Dan", duration: "4:35", interestedPlayers: [] },
    { id: 4, title: "Friday I'm in Love – The Cure", duration: "3:34", interestedPlayers: [] },
    { id: 5, title: "Layla – Original version", duration: "7:10", interestedPlayers: [] },
    { id: 6, title: "Lotta Love – Nicolette Larson", duration: "3:11", interestedPlayers: [] },
    { id: 7, title: "Whose Bed Have Your Boots Been Under", duration: "", interestedPlayers: [] },
    { id: 8, title: "The Perfect Pair - Elica", duration: "", interestedPlayers: [] },
    { id: 9, title: "Our Day Will Come - Laura", duration: "", interestedPlayers: [] },
    { id: 10, title: "Sultans of Swing", duration: "5:48", interestedPlayers: [] },
    { id: 11, title: "Country Roads", duration: "3:13", interestedPlayers: [] },
    { id: 12, title: "Hasn't Hit Me Yet", duration: "", interestedPlayers: [] },
    { id: 13, title: "It's Too Late", duration: "3:53", interestedPlayers: [] },
    { id: 14, title: "Rhinestone Cowboy", duration: "3:15", interestedPlayers: [] },
    { id: 15, title: "Can't Take My Eyes Off You", duration: "3:23", interestedPlayers: [] },
    { id: 16, title: "You'll Never Find Another Love Like Mine", duration: "", interestedPlayers: [] },
    { id: 17, title: "Winners and Losers - Hamilton Joe Frank and Reynolds", duration: "3:00", interestedPlayers: [] },
    { id: 18, title: "He's Not Heavy, He's My Brother", duration: "", interestedPlayers: [] },
    { id: 19, title: "Suspicious Minds", duration: "4:22", interestedPlayers: [] },
    { id: 20, title: "You Got It", duration: "", interestedPlayers: [] },
    { id: 21, title: "Guest 1", duration: "4:00", interestedPlayers: [] },
    { id: 22, title: "Guest 2", duration: "4:00", interestedPlayers: [] },
    { id: 23, title: "Guest 3", duration: "4:00", interestedPlayers: [] }
  ];

  // Load songs from localStorage or use default
  const [songs, setSongs] = useState<Song[]>(() => {
    const savedSongs = localStorage.getItem('song-tracker-playlist');
    if (savedSongs) {
      try {
        const parsed = JSON.parse(savedSongs);
        // Migrate old data format to new format with interestedPlayers
        let migratedSongs = parsed.map((song: any) => ({
          ...song,
          interestedPlayers: song.interestedPlayers || []
        }));

        // Check if we need to add the missing Guest songs
        const hasGuest1 = migratedSongs.some((song: Song) => song.id === 22);
        const hasGuest2 = migratedSongs.some((song: Song) => song.id === 23);
        const hasGuest3 = migratedSongs.some((song: Song) => song.id === 24);

        if (!hasGuest1) {
          migratedSongs.push({ id: 22, title: "Guest 1", duration: "4:00", interestedPlayers: [] });
        }
        if (!hasGuest2) {
          migratedSongs.push({ id: 23, title: "Guest 2", duration: "4:00", interestedPlayers: [] });
        }
        if (!hasGuest3) {
          migratedSongs.push({ id: 24, title: "Guest 3", duration: "4:00", interestedPlayers: [] });
        }

        // Sort by ID to maintain order
        migratedSongs.sort((a: Song, b: Song) => a.id - b.id);

        return migratedSongs;
      } catch (error) {
        console.error('Error parsing saved songs:', error);
        return defaultSongs;
      }
    }
    return defaultSongs;
  });

  const [totalTime, setTotalTime] = useState({ minutes: 0, seconds: 0, songsWithTime: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Notification state for non-blocking confirmations
  const [notification, setNotification] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  // Track last notification timestamp to prevent spam
  const lastNotificationRef = useRef<number>(0);
  // Ref mirror of isSyncing to avoid race conditions inside async callbacks
  const isSyncingRef = useRef<boolean>(false);
  // Timestamp when the current sync started (ms)
  const syncingStartRef = useRef<number | null>(null);

  // Manual force-clear for stuck syncs
  const forceClearSync = () => {
    console.warn('[WARN] forceClearSync() called - clearing syncing flags');
    isSyncingRef.current = false;
    syncingStartRef.current = null;
    setIsSyncing(false);
  };

  // Save to localStorage whenever songs change
  useEffect(() => {
    localStorage.setItem('song-tracker-playlist', JSON.stringify(songs));
  }, [songs]);

  // Database sync functions
  const loadFromDatabase = useCallback(async () => {
    console.debug('[DEBUG] loadFromDatabase() called');
    // Prevent overlapping loads
    if (isSyncingRef.current) {
      console.log('Skipped loadFromDatabase because a sync is already in progress');
      return;
    }
    setIsSyncing(true);
    isSyncingRef.current = true;
    syncingStartRef.current = Date.now();
    console.debug('[DEBUG] loadFromDatabase - set isSyncing true');
    try {
      const dbSongs = await SongService.getAllSongs();
      if (dbSongs.length > 0) {
        // Check for duplicates before loading
        const titleMap = new Map();
        const duplicates = [];
        
        for (const song of dbSongs) {
          if (titleMap.has(song.title)) {
            duplicates.push(song);
            console.warn(`Found duplicate song: "${song.title}" (ID: ${song.id})`);
          } else {
            titleMap.set(song.title, song.id);
          }
        }
        
        // If duplicates found, alert user and offer to fix
        if (duplicates.length > 0) {
          console.warn(`Found ${duplicates.length} duplicate songs in database`);
          // Use non-blocking notification instead of window.confirm
          setNotification({
            message: `Found ${duplicates.length} duplicate songs in the database. Fix now?`,
            onConfirm: async () => {
              await fixDatabaseDuplicates();
              setNotification(null);
              // ensure we clear syncing flags before returning
              setIsSyncing(false);
              isSyncingRef.current = false;
              syncingStartRef.current = null;
            }
          });
          return; // This will reload after fixing
        }
        
        // Check for Guest titles without numbers
        const guestSongsWithoutNumbers = dbSongs.filter(song => 
          (song.title.trim() === "Guest" || 
          (song.title.includes("Guest") && !song.title.match(/Guest\s+\d+/)))
        );
        
        if (guestSongsWithoutNumbers.length > 0) {
          console.warn(`Found ${guestSongsWithoutNumbers.length} Guest songs without numbers`);
          // Use non-blocking notification instead of window.confirm
          setNotification({
            message: `Found ${guestSongsWithoutNumbers.length} Guest songs without numbers. Fix now?`,
            onConfirm: async () => {
              await fixGuestTitles();
              setNotification(null);
              // ensure we clear syncing flags before returning
              setIsSyncing(false);
              isSyncingRef.current = false;
              syncingStartRef.current = null;
            }
          });
          return; // This will reload after fixing
        }
        
        // Convert database songs to app format
        const convertedSongs = dbSongs.map(dbSong => ({
          id: dbSong.id,
          title: dbSong.title,
          duration: dbSong.duration,
          interestedPlayers: [], // Keep for legacy compatibility
          players: dbSong.players,
          pdf_url: dbSong.pdf_url,
          pdf_urls: dbSong.pdf_urls || []
        }));
        
        setSongs(convertedSongs);
        setLastSynced(new Date());
        setIsOnline(true);
        console.log('✅ Loaded songs from database');
      }
    } catch (error) {
      console.error('❌ Failed to load from database:', error);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
      syncingStartRef.current = null;
      // Safety fallback: ensure syncing flag clears after 20s in case of an unexpected hang
      setTimeout(() => {
        if (isSyncingRef.current) {
          console.warn('[WARN] isSyncingRef was still true after timeout, forcing clear');
          isSyncingRef.current = false;
          setIsSyncing(false);
        }
      }, 20000);
    }
  // Intentionally run only on mount; these helper functions are defined later and
  // including them would create circular dependencies. The function uses stable
  // services and is safe to run once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToDatabase = useCallback(async () => {
    console.debug('[DEBUG] saveToDatabase() called');
    // Prevent overlapping saves
    if (isSyncingRef.current) {
      console.log('Skipped saveToDatabase because a sync is already in progress');
      return;
    }
    setIsSyncing(true);
    isSyncingRef.current = true;
    syncingStartRef.current = Date.now();
    console.debug('[DEBUG] saveToDatabase - set isSyncing true');
    try {
      // Convert app songs to database format
      const dbSongs: DatabaseSong[] = songs.map(song => ({
        id: song.id,
        title: song.title,
        duration: song.duration,
        players: song.players || {
          electricGuitar: [],
          acousticGuitar: [],
          bass: [],
          vocals: [],
          backupVocals: []
        },
        pdf_url: song.pdf_url
      }));
      
      const success = await SongService.saveAllSongs(dbSongs);
      if (success) {
        setLastSynced(new Date());
        setIsOnline(true);
        console.log('✅ Saved songs to database');
      } else {
        setIsOnline(false);
      }
    } catch (error) {
      console.error('❌ Failed to save to database:', error);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
      syncingStartRef.current = null;
      // Safety fallback: ensure syncing flag clears after 20s in case of an unexpected hang
      setTimeout(() => {
        if (isSyncingRef.current) {
          console.warn('[WARN] isSyncingRef was still true after timeout, forcing clear');
          isSyncingRef.current = false;
          setIsSyncing(false);
        }
      }, 20000);
    }
  }, [songs]);

  // Watchdog: if a sync is stuck for more than 25s, force-clear it
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSyncingRef.current && syncingStartRef.current) {
        const elapsed = Date.now() - syncingStartRef.current;
        if (elapsed > 25000) {
          console.warn('[WARN] Sync appears stuck (>25s). Forcing clear.');
          isSyncingRef.current = false;
          syncingStartRef.current = null;
          setIsSyncing(false);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Debug watcher: log changes to isSyncing and the ref
  useEffect(() => {
    console.debug('[DEBUG] isSyncing state changed:', { isSyncing, isSyncingRef: isSyncingRef.current });
  }, [isSyncing]);

  // Auto-save to database when songs change
  useEffect(() => {
    if (songs.length > 0) {
      const timeoutId = setTimeout(() => {
        // Avoid triggering auto-save while a manual sync is in progress
        if (!isSyncingRef.current) saveToDatabase();
      }, 2000); // Auto-save 2 seconds after changes

      return () => clearTimeout(timeoutId);
    }
  }, [songs, saveToDatabase]);

  // Track the last time we made a change locally
  const lastLocalChangeRef = useRef(Date.now());

  // Load from database on component mount
  useEffect(() => {
    loadFromDatabase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up real-time subscription with smarter handling
  useEffect(() => {
    const subscription = SongService.subscribeToChanges((updatedSongs: DatabaseSong[]) => {
      // Only process updates when we're online and not currently syncing
      if (isOnline && !isSyncingRef.current) {
        const now = Date.now();
        
        // If this update is too soon after our own change, ignore it
        if (now - lastLocalChangeRef.current < 5000) {
          console.debug('[DEBUG] Ignoring real-time update - too soon after local change');
          return;
        }
        
        // Prevent notification spam - only show once every 30 seconds
        if (now - lastNotificationRef.current > 30000) {
          lastNotificationRef.current = now;
          
          // Compare current songs with updated songs to check if there are actual changes
          const hasChanges = checkForRealChanges(songs, updatedSongs);
          
          if (hasChanges) {
            // Create a merged version that preserves local PDF URLs
            const mergedSongs = updatedSongs.map(dbSong => {
              const currentSong = songs.find(s => s.id === dbSong.id);
              const currentPdfUrls = currentSong ? getSongPdfUrls(currentSong) : [];
              const dbPdfUrls = getDbSongPdfUrls(dbSong);
              
              // Merge PDF URLs, keeping local ones first
              const urlSet = new Set([...currentPdfUrls, ...dbPdfUrls]);
              const mergedPdfUrls = Array.from(urlSet);
              
              return {
                id: dbSong.id,
                title: dbSong.title,
                duration: dbSong.duration,
                interestedPlayers: [],
                players: dbSong.players,
                // Keep local PDF URL if it exists
                pdf_url: currentSong?.pdf_url || dbSong.pdf_url,
                pdf_urls: mergedPdfUrls
              };
            });

            // Only show notification if we're not the ones who made the change
            setNotification({
              message: 'Changes made from another session detected. Load the latest data?',
              onConfirm: () => {
                setSongs(mergedSongs);
                setLastSynced(new Date());
                setNotification(null);
              }
            });
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isOnline, songs]);

  // Fix Guest titles - ensure they include the numbers
  const fixGuestTitles = async () => {
    try {
      console.log('Checking for Guest titles that need fixing...');
      
      // Get all songs from the database
      const { data: allSongs, error } = await supabase
        .from('songs')
        .select('*')
        .order('id');
        
      if (error) throw error;
      
      // Check for Guest songs
      const guestSongs = allSongs?.filter(song => 
        (song.title.trim() === "Guest" || 
        (song.title.includes("Guest") && !song.title.match(/Guest\s+\d+/)))
      );
      
      console.log('Found Guest songs that need fixing:', guestSongs?.length || 0);
      
      if (guestSongs && guestSongs.length > 0) {
        // Fix the Guest titles
        for (let i = 0; i < guestSongs.length; i++) {
          const song = guestSongs[i];
          const newTitle = `Guest ${i + 1}`;
          
          console.log(`Fixing: "${song.title}" -> "${newTitle}"`);
          
          await supabase.from('songs').update({
            title: newTitle
          }).eq('id', song.id);
        }
        
        console.log('Guest titles fixed successfully');
        
        // Reload from database
        await loadFromDatabase();
        
        alert('Guest titles have been fixed!');
      } else {
        console.log('No Guest titles need fixing');
        alert('Guest titles are already correct.');
      }
    } catch (error) {
      console.error('Error fixing Guest titles:', error);
      alert('Error fixing Guest titles. See console for details.');
    }
  };

  // Fix database duplicates
  const fixDatabaseDuplicates = async () => {
    try {
      const { data: allSongs, error } = await supabase
        .from('songs')
        .select('*')
        .order('id');
      
      if (error) throw error;
      
      console.log('All songs in database:');
      allSongs?.forEach((song: DatabaseSong) => {
        console.log(`ID: ${song.id}, Title: "${song.title}"`);
      });
      
      // Look specifically for the problematic duplicate
      const sultansSongs = allSongs?.filter(song => 
        song.title.toLowerCase().includes('sultans of swing')
      );
      
      console.log('Sultans of Swing songs found:', sultansSongs);
      
      if (sultansSongs && sultansSongs.length > 1) {
        // Find the one that's just "Sultans of Swing" without artist
        const duplicateToDelete = sultansSongs.find(song => 
          song.title.trim() === "Sultans of Swing"
        );
        
        if (duplicateToDelete) {
          console.log(`Deleting duplicate: "${duplicateToDelete.title}" (ID: ${duplicateToDelete.id})`);
          await supabase.from('songs').delete().eq('id', duplicateToDelete.id);
          console.log('Duplicate deleted successfully');
          await loadFromDatabase(); // Refresh
        } else {
          console.log('No exact "Sultans of Swing" duplicate found to delete');
        }
      } else {
        console.log('No Sultans of Swing duplicates found');
      }
      
    } catch (error) {
      console.error('Error fixing database duplicates:', error);
    }
  };

  // Calculate total time whenever songs change
  useEffect(() => {
    let totalSeconds = 0;
    let songsWithValidTime = 0;
    
    songs.forEach((song: Song) => {
      if (song.duration && song.duration.trim()) {
        const [minutes, seconds] = song.duration.split(':').map(Number);
        if (!isNaN(minutes) && !isNaN(seconds)) {
          totalSeconds += minutes * 60 + seconds;
          songsWithValidTime++;
        }
      }
    });
    
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    setTotalTime({ 
      minutes: totalMinutes, 
      seconds: remainingSeconds,
      songsWithTime: songsWithValidTime
    });
  }, [songs]);

  const updateSong = (id: number, field: string, value: string) => {
    // Block function if user is not admin
    if (userRole !== 'admin') {
      alert('Only admin users can edit song details.');
      return;
    }
    
    setSongs(songs.map((song: Song) => 
      song.id === id ? { ...song, [field]: value } : song
    ));
  };

  const addSong = () => {
    // Block function if user is not admin
    if (userRole !== 'admin') {
      alert('Only admin users can add songs.');
      return;
    }
    
    const newId = Math.max(...songs.map((s: Song) => s.id)) + 1;
    setSongs([...songs, { id: newId, title: "", duration: "", interestedPlayers: [] }]);
  };

  const deleteSong = async (id: number) => {
    // Block function if user is not admin
    if (userRole !== 'admin') {
      alert('Only admin users can delete songs.');
      return;
    }
    
    // Update local state
    setSongs(songs.filter((song: Song) => song.id !== id));
    
    // Delete from database
    try {
      await supabase.from('songs').delete().eq('id', id);
      console.log(`Song with ID ${id} deleted from database`);
    } catch (error) {
      console.error(`Failed to delete song with ID ${id} from database:`, error);
    }
  };

  // Handle PDF upload for a song
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, songId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.debug('[DEBUG] Starting PDF upload for song:', songId);
    
    try {
      const url = await SongService.uploadPdf(file, songId);
      if (url) {
        console.debug('[DEBUG] PDF uploaded successfully, URL:', url);
        
        // Update local state with multiple PDF support
        const updatedSongs = songs.map(song => {
          if (song.id === songId) {
            const currentPdfUrls = getSongPdfUrls(song);
            const newPdfUrls = [...currentPdfUrls, url];
            return { 
              ...song, 
              pdf_url: url, // Keep for backward compatibility
              pdf_urls: newPdfUrls 
            };
          }
          return song;
        });
        setSongs(updatedSongs);
        
        // Save to database
        const songToUpdate = updatedSongs.find(s => s.id === songId);
        if (songToUpdate) {
          await SongService.saveSong({
            id: songToUpdate.id,
            title: songToUpdate.title,
            duration: songToUpdate.duration,
            players: songToUpdate.players || {
              electricGuitar: [],
              acousticGuitar: [],
              bass: [],
              vocals: [],
              backupVocals: []
            },
            pdf_url: url,
            pdf_urls: songToUpdate.pdf_urls
          });
        }
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Failed to upload PDF. Please try again.');
    }
  };

  // Remove a specific PDF from a song
  const removePdf = async (songId: number, pdfUrl: string) => {
    const updatedSongs = songs.map(song => {
      if (song.id === songId) {
        const currentPdfUrls = getSongPdfUrls(song);
        const filteredUrls = currentPdfUrls.filter(url => url !== pdfUrl);
        
        return { 
          ...song, 
          pdf_url: filteredUrls.length > 0 ? filteredUrls[0] : null, // Keep first for backward compatibility
          pdf_urls: filteredUrls.length > 0 ? filteredUrls : []
        };
      }
      return song;
    });
    setSongs(updatedSongs);
    
    // Save to database
    const songToUpdate = updatedSongs.find(s => s.id === songId);
    if (songToUpdate) {
      await SongService.saveSong({
        id: songToUpdate.id,
        title: songToUpdate.title,
        duration: songToUpdate.duration,
        players: songToUpdate.players || {
          electricGuitar: [],
          acousticGuitar: [],
          bass: [],
          vocals: [],
          backupVocals: []
        },
        pdf_url: songToUpdate.pdf_url,
        pdf_urls: songToUpdate.pdf_urls
      });
    }
  };

  // Add a player to a specific instrument for a song
  const addPlayerToInstrument = (songId: number, instrument: string, playerName: string) => {
    // Block function if user is not admin
    if (userRole !== 'admin') {
      alert('Only admin users can add players to instruments.');
      return;
    }
    
    if (!playerName.trim()) return;
    
    // Create a new songs array with the updated song
    const updatedSongs = songs.map((song: Song) => {
      if (song.id !== songId) return song;
      
      // Initialize players object if it doesn't exist
      const currentPlayers = song.players || {
        electricGuitar: [],
        acousticGuitar: [],
        bass: [],
        vocals: [],
        backupVocals: []
      };
      
      // Add player to the specific instrument if not already there
      const instrumentPlayers = currentPlayers[instrument as keyof typeof currentPlayers] || [];
      if (!instrumentPlayers.includes(playerName.trim())) {
        return {
          ...song,
          players: {
            ...currentPlayers,
            [instrument]: [...instrumentPlayers, playerName.trim()]
          }
        };
      }
      
      return song;
    });
    
    // Update state
    setSongs(updatedSongs);
    
    // Find the updated song to save directly to database
    const songToUpdate = updatedSongs.find(song => song.id === songId);
    if (songToUpdate && songToUpdate.players) {
      SongService.saveSong({
        id: songToUpdate.id,
        title: songToUpdate.title,
        duration: songToUpdate.duration,
        players: songToUpdate.players,
        pdf_url: songToUpdate.pdf_url || null,
        pdf_urls: songToUpdate.pdf_urls
      }).then(() => {
        setTimeout(() => {
          loadFromDatabase();
        }, 300);
      });
    }
  };

  // Remove a player from a specific instrument
  const removePlayerFromInstrument = (songId: number, instrument: string, playerName: string) => {
    // Block function if user is not admin
    if (userRole !== 'admin') {
      alert('Only admin users can remove players from instruments.');
      return;
    }
    
    // Create a new songs array with the updated song
    const updatedSongs = songs.map((song: Song) => {
      if (song.id !== songId || !song.players) return song;
      
      return {
        ...song,
        players: {
          ...song.players,
          [instrument]: song.players[instrument as keyof typeof song.players]?.filter(player => player !== playerName) || []
        }
      };
    });
    
    // Update state
    setSongs(updatedSongs);
    
    // Find the updated song to save directly to database
    const songToUpdate = updatedSongs.find(song => song.id === songId);
    if (songToUpdate && songToUpdate.players) {
      SongService.saveSong({
        id: songToUpdate.id,
        title: songToUpdate.title,
        duration: songToUpdate.duration,
        players: songToUpdate.players,
        pdf_url: songToUpdate.pdf_url || null,
        pdf_urls: songToUpdate.pdf_urls
      }).then(() => {
        setTimeout(() => {
          loadFromDatabase();
        }, 300);
      });
    }
  };

  // Remove a player from a song's interested list
  const removePlayerFromSong = (songId: number, playerName: string) => {
    setSongs(songs.map((song: Song) => 
      song.id === songId 
        ? { ...song, interestedPlayers: song.interestedPlayers.filter(player => player !== playerName) }
        : song
    ));
  };

  const exportToCSV = () => {
    const headers = ['Song #', 'Title', 'Duration'];
    const csvContent = [
      headers.join(','),
      ...songs.map((song: Song) => [
        song.id,
        `"${song.title}"`,
        song.duration
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'song-playlist.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatTotalTime = () => {
    const hours = Math.floor(totalTime.minutes / 60);
    const minutes = totalTime.minutes % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${totalTime.seconds.toString().padStart(2, '0')}`;
    }
    return `${totalTime.minutes}:${totalTime.seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Non-blocking notification */}
        {notification && (
          <Notification
            message={notification.message}
            onConfirm={notification.onConfirm}
            onClose={() => setNotification(null)}
          />
        )}
        
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
              <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Massey Hall Song List</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm sm:text-lg text-amber-400 font-medium">November 15, 2025</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  userRole === 'admin' 
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600' 
                    : 'bg-blue-900/60 text-blue-300 border border-blue-600'
                }`}>
                  {userRole === 'admin' ? '👑 Admin' : '👀 Viewer'}
                </span>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-xs"
                  title="Logout and login as admin"
                >
                  <LogOut className="w-3 h-3" />
                  Admin
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 gap-4 lg:gap-0">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-xl p-4 sm:p-5 shadow-xl">
                <div className="text-xs sm:text-sm text-amber-400 font-semibold mb-1">Total Playlist Time</div>
                <div className="text-xl sm:text-2xl font-bold text-white">{formatTotalTime()}</div>
                <div className="text-xs sm:text-sm text-slate-300">{totalTime.songsWithTime} of {songs.length} songs timed</div>
              </div>
              
              {/* Online indicator - admin only */}
              {userRole === 'admin' && (
                <div className={`border rounded-xl p-4 sm:p-5 shadow-xl backdrop-blur ${isOnline ? 'bg-emerald-900/80 border-emerald-600' : 'bg-red-900/80 border-red-600'}`}>
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    {isSyncing ? (
                      <>
                        <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-amber-400 border-t-transparent rounded-full"></div>
                        <span className="text-amber-400">Syncing...</span>
                      </>
                    ) : isOnline ? (
                      <>
                        <Cloud className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                        <span className="text-emerald-400">Online</span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                        <span className="text-red-400">Offline</span>
                      </>
                    )}
                  </div>
                  {lastSynced && (
                    <div className="text-xs text-slate-400 mt-1">
                      Last synced: {lastSynced.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Primary Controls */}
              {userRole === 'admin' && (
                <button
                  onClick={addSong}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium border border-emerald-500 text-sm sm:text-base"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Add Song
                </button>
              )}
              {/* Sync Now button - admin only */}
              {userRole === 'admin' && (
                <button
                  onClick={loadFromDatabase}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-amber-500 text-sm sm:text-base"
                >
                  <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                  Sync Now
                </button>
              )}
              <button
                onClick={exportToCSV}
                title="Export to Google Sheets, Excel, or print"
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium border border-slate-500 text-sm sm:text-base"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl overflow-hidden shadow-2xl">
          {/* Mobile-first table design */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead className="bg-slate-700/90">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400 w-20">Song #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">Title & Players</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400 w-32">Duration (M:SS)</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-amber-400 w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {songs.map((song: Song, index: number) => (
                  <tr key={song.id} className="hover:bg-slate-700/50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-200">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-3 mt-3">
                        {/* Song title input */}
                        <input
                          type="text"
                          value={song.title}
                          onChange={(e) => updateSong(song.id, 'title', e.target.value)}
                          readOnly={userRole !== 'admin'}
                          className={`w-full p-3 text-base border border-slate-600 rounded-lg text-white placeholder-slate-400 font-medium ${
                            userRole === 'admin' 
                              ? 'bg-slate-700/50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500' 
                              : 'bg-slate-800/60 cursor-not-allowed'
                          }`}
                          placeholder="Enter song title..."
                        />
                        {/* PDF Section - Combined upload and view */}
                        {(userRole === 'admin' || getSongPdfUrls(song).length > 0) && (
                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-amber-400 mb-2">Sheet Music PDF</label>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Upload button - admin only */}
                              {userRole === 'admin' && (
                                <>
                                  <input
                                    type="file"
                                    id={`pdf-upload-${song.id}`}
                                    accept=".pdf"
                                    onChange={(e) => handlePdfUpload(e, song.id)}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor={`pdf-upload-${song.id}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-md border border-slate-600 cursor-pointer transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    Upload PDF
                                  </label>
                                </>
                              )}
                              
                              {/* View buttons for all PDFs - in the same row */}
                              {getSongPdfUrls(song).map((pdfUrl, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 text-xs font-medium rounded-md border border-amber-700/50 transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    View PDF {getSongPdfUrls(song).length > 1 ? `#${index + 1}` : ''}
                                  </a>
                                  {userRole === 'admin' && (
                                    <button
                                      onClick={() => removePdf(song.id, pdfUrl)}
                                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded-md transition-colors"
                                      title="Remove PDF"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Players section - Sophisticated monochromatic design */}
                      <div className="space-y-3 mt-3">
                        <div className="text-sm font-semibold text-amber-400 mb-3">Band Members by Instrument:</div>
                        
                        {/* Electric Guitar */}
                        <div className="flex items-center gap-3 p-3 bg-slate-700/60 border border-slate-600 rounded-lg">
                          <Guitar className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-red-300 min-w-[80px]">Electric:</span>
                          <div className="flex flex-wrap gap-2 flex-1">
                            {song.players?.electricGuitar?.map((player, playerIndex) => (
                              <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-red-900/40 text-red-200 text-xs rounded-full font-medium border border-red-700/50">
                                {player}
                                {userRole === 'admin' && (
                                  <button 
                                    onClick={() => removePlayerFromInstrument(song.id, 'electricGuitar', player)}
                                    className="text-red-400 hover:text-red-200 transition-colors"
                                    title="Remove player"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))}
                            {userRole === 'admin' && (
                              <button 
                                onClick={() => {
                                  const name = prompt('Enter player name for Electric Guitar:');
                                  if (name) addPlayerToInstrument(song.id, 'electricGuitar', name);
                                }}
                                className="px-3 py-1 text-red-400 hover:bg-red-900/40 text-xs rounded-full border border-red-700/50 hover:border-red-600 transition-colors font-medium"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Acoustic Guitar */}
                        <div className="flex items-center gap-3 p-3 bg-slate-700/60 border border-slate-600 rounded-lg">
                          <Guitar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-amber-300 min-w-[80px]">Acoustic:</span>
                          <div className="flex flex-wrap gap-2 flex-1">
                            {song.players?.acousticGuitar?.map((player, playerIndex) => (
                              <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-900/40 text-amber-200 text-xs rounded-full font-medium border border-amber-700/50">
                                {player}
                                {userRole === 'admin' && (
                                  <button 
                                    onClick={() => removePlayerFromInstrument(song.id, 'acousticGuitar', player)}
                                    className="text-amber-400 hover:text-amber-200 transition-colors"
                                    title="Remove player"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))}
                            {userRole === 'admin' && (
                              <button 
                                onClick={() => {
                                  const name = prompt('Enter player name for Acoustic Guitar:');
                                  if (name) addPlayerToInstrument(song.id, 'acousticGuitar', name);
                                }}
                                className="px-3 py-1 text-amber-400 hover:bg-amber-900/40 text-xs rounded-full border border-amber-700/50 hover:border-amber-600 transition-colors font-medium"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bass */}
                        <div className="flex items-center gap-3 p-3 bg-slate-700/60 border border-slate-600 rounded-lg">
                          <Guitar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-purple-300 min-w-[80px]">Bass:</span>
                          <div className="flex flex-wrap gap-2 flex-1">
                            {song.players?.bass?.map((player, playerIndex) => (
                              <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-900/40 text-purple-200 text-xs rounded-full font-medium border border-purple-700/50">
                                {player}
                                {userRole === 'admin' && (
                                  <button 
                                    onClick={() => removePlayerFromInstrument(song.id, 'bass', player)}
                                    className="text-purple-400 hover:text-purple-200 transition-colors"
                                    title="Remove player"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))}
                            {userRole === 'admin' && (
                              <button 
                                onClick={() => {
                                  const name = prompt('Enter player name for Bass:');
                                  if (name) addPlayerToInstrument(song.id, 'bass', name);
                                }}
                                className="px-3 py-1 text-purple-400 hover:bg-purple-900/40 text-xs rounded-full border border-purple-700/50 hover:border-purple-600 transition-colors font-medium"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Vocals */}
                        <div className="flex items-center gap-3 p-3 bg-slate-700/60 border border-slate-600 rounded-lg">
                          <Mic className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-blue-300 min-w-[80px]">Vocals:</span>
                          <div className="flex flex-wrap gap-2 flex-1">
                            {song.players?.vocals?.map((player, playerIndex) => (
                              <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/40 text-blue-200 text-xs rounded-full font-medium border border-blue-700/50">
                                {player}
                                {userRole === 'admin' && (
                                  <button 
                                    onClick={() => removePlayerFromInstrument(song.id, 'vocals', player)}
                                    className="text-blue-400 hover:text-blue-200 transition-colors"
                                    title="Remove player"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))}
                            {userRole === 'admin' && (
                              <button 
                                onClick={() => {
                                  const name = prompt('Enter player name for Vocals:');
                                  if (name) addPlayerToInstrument(song.id, 'vocals', name);
                                }}
                                className="px-3 py-1 text-blue-400 hover:bg-blue-900/40 text-xs rounded-full border border-blue-700/50 hover:border-blue-600 transition-colors font-medium"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Backup Vocals */}
                        <div className="flex items-center gap-3 p-3 bg-slate-700/60 border border-slate-600 rounded-lg">
                          <Mic className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-emerald-300 min-w-[80px]">Backup:</span>
                          <div className="flex flex-wrap gap-2 flex-1">
                            {song.players?.backupVocals?.map((player, playerIndex) => (
                              <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-900/40 text-emerald-200 text-xs rounded-full font-medium border border-emerald-700/50">
                                {player}
                                {userRole === 'admin' && (
                                  <button 
                                    onClick={() => removePlayerFromInstrument(song.id, 'backupVocals', player)}
                                    className="text-emerald-400 hover:text-emerald-200 transition-colors"
                                    title="Remove player"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))}
                            {userRole === 'admin' && (
                              <button 
                                onClick={() => {
                                  const name = prompt('Enter player name for Backup Vocals:');
                                  if (name) addPlayerToInstrument(song.id, 'backupVocals', name);
                                }}
                                className="px-3 py-1 text-emerald-400 hover:bg-emerald-900/40 text-xs rounded-full border border-emerald-700/50 hover:border-emerald-600 transition-colors font-medium"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Old system data preservation */}
                        {song.interestedPlayers.length > 0 && (
                          <div className="mt-3 p-3 bg-slate-700/40 border border-slate-600 rounded-lg">
                            <div className="text-xs font-medium text-slate-400 mb-2">Legacy Interest List:</div>
                            <div className="flex flex-wrap gap-2">
                              {song.interestedPlayers.map((player, playerIndex) => (
                                <span
                                  key={playerIndex}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-600/60 text-slate-300 text-xs rounded-full border border-slate-500"
                                >
                                  <Users className="w-3 h-3" />
                                  {player}
                                  <button
                                    onClick={() => removePlayerFromSong(song.id, player)}
                                    className="text-slate-400 hover:text-slate-200"
                                    title="Remove player"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-slate-500 mt-2">
                              ↑ These can be moved to specific instruments
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={song.duration}
                        onChange={(e) => updateSong(song.id, 'duration', e.target.value)}
                        readOnly={userRole !== 'admin'}
                        className={`w-full p-2 text-sm border border-slate-600 rounded text-white placeholder-slate-400 ${
                          userRole === 'admin' 
                            ? 'bg-slate-700/50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500' 
                            : 'bg-slate-800/60 cursor-not-allowed'
                        }`}
                        placeholder="4:35"
                        pattern="[0-9]+:[0-5][0-9]"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {userRole === 'admin' && (
                        <button
                          onClick={() => deleteSong(song.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded-lg transition-colors"
                          title="Delete song"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="lg:hidden space-y-4">
          {songs.map((song: Song, index: number) => (
            <div key={song.id} className="bg-slate-700/60 border border-slate-600 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-amber-400">Song #{index + 1}</span>
                {userRole === 'admin' && (
                  <button
                    onClick={() => deleteSong(song.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded-lg transition-colors"
                    title="Delete song"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <input
                type="text"
                value={song.title}
                onChange={(e) => updateSong(song.id, 'title', e.target.value)}
                readOnly={userRole !== 'admin'}
                className={`w-full p-3 text-base border border-slate-600 rounded-lg text-white placeholder-slate-400 font-medium mb-3 ${
                  userRole === 'admin' 
                    ? 'bg-slate-700/50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500' 
                    : 'bg-slate-800/60 cursor-not-allowed'
                }`}
                placeholder="Enter song title..."
              />

              {/* PDF Section - Combined upload and view */}
              {(userRole === 'admin' || getSongPdfUrls(song).length > 0) && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-amber-400 mb-2">Sheet Music PDF</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Upload button - admin only */}
                    {userRole === 'admin' && (
                      <>
                        <input
                          type="file"
                          id={`pdf-upload-mobile-${song.id}`}
                          accept=".pdf"
                          onChange={(e) => handlePdfUpload(e, song.id)}
                          className="hidden"
                        />
                        <label
                          htmlFor={`pdf-upload-mobile-${song.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-md border border-slate-600 cursor-pointer transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Upload PDF
                        </label>
                      </>
                    )}
                    
                    {/* View buttons for all PDFs - in the same row */}
                    {getSongPdfUrls(song).map((pdfUrl, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 text-xs font-medium rounded-md border border-amber-700/50 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          View PDF {getSongPdfUrls(song).length > 1 ? `#${index + 1}` : ''}
                        </a>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => removePdf(song.id, pdfUrl)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded-md transition-colors"
                            title="Remove PDF"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-semibold text-amber-400 mb-2">Duration (M:SS)</label>
                <input
                  type="text"
                  value={song.duration}
                  onChange={(e) => updateSong(song.id, 'duration', e.target.value)}
                  readOnly={userRole !== 'admin'}
                  className={`w-full p-2 text-sm border border-slate-600 rounded-lg text-white placeholder-slate-400 ${
                    userRole === 'admin' 
                      ? 'bg-slate-700/50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500' 
                      : 'bg-slate-800/60 cursor-not-allowed'
                  }`}
                  placeholder="4:35"
                  pattern="[0-9]+:[0-5][0-9]"
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-amber-400">Band Members by Instrument:</div>
                
                <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Guitar className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-300">Electric Guitar:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {song.players?.electricGuitar?.map((player, playerIndex) => (
                      <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-red-900/40 text-red-200 text-xs rounded-full font-medium border border-red-700/50">
                        {player}
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => removePlayerFromInstrument(song.id, 'electricGuitar', player)}
                            className="text-red-400 hover:text-red-200 transition-colors"
                            title="Remove player"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {userRole === 'admin' && (
                      <button 
                        onClick={() => {
                          const name = prompt('Enter player name for Electric Guitar:');
                          if (name) addPlayerToInstrument(song.id, 'electricGuitar', name);
                        }}
                        className="px-3 py-1 text-red-400 hover:bg-red-900/40 text-xs rounded-full border border-red-700/50 hover:border-red-600 transition-colors font-medium"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Guitar className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-300">Acoustic Guitar:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {song.players?.acousticGuitar?.map((player, playerIndex) => (
                      <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-900/40 text-amber-200 text-xs rounded-full font-medium border border-amber-700/50">
                        {player}
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => removePlayerFromInstrument(song.id, 'acousticGuitar', player)}
                            className="text-amber-400 hover:text-amber-200 transition-colors"
                            title="Remove player"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {userRole === 'admin' && (
                      <button 
                        onClick={() => {
                          const name = prompt('Enter player name for Acoustic Guitar:');
                          if (name) addPlayerToInstrument(song.id, 'acousticGuitar', name);
                        }}
                        className="px-3 py-1 text-amber-400 hover:bg-amber-900/40 text-xs rounded-full border border-amber-700/50 hover:border-amber-600 transition-colors font-medium"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Guitar className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-300">Bass:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {song.players?.bass?.map((player, playerIndex) => (
                      <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-900/40 text-purple-200 text-xs rounded-full font-medium border border-purple-700/50">
                        {player}
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => removePlayerFromInstrument(song.id, 'bass', player)}
                            className="text-purple-400 hover:text-purple-200 transition-colors"
                            title="Remove player"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {userRole === 'admin' && (
                      <button 
                        onClick={() => {
                          const name = prompt('Enter player name for Bass:');
                          if (name) addPlayerToInstrument(song.id, 'bass', name);
                        }}
                        className="px-3 py-1 text-purple-400 hover:bg-purple-900/40 text-xs rounded-full border border-purple-700/50 hover:border-purple-600 transition-colors font-medium"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-300">Vocals:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {song.players?.vocals?.map((player, playerIndex) => (
                      <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/40 text-blue-200 text-xs rounded-full font-medium border border-blue-700/50">
                        {player}
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => removePlayerFromInstrument(song.id, 'vocals', player)}
                            className="text-blue-400 hover:text-blue-200 transition-colors"
                            title="Remove player"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {userRole === 'admin' && (
                      <button 
                        onClick={() => {
                          const name = prompt('Enter player name for Vocals:');
                          if (name) addPlayerToInstrument(song.id, 'vocals', name);
                        }}
                        className="px-3 py-1 text-blue-400 hover:bg-blue-900/40 text-xs rounded-full border border-blue-700/50 hover:border-blue-600 transition-colors font-medium"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-300">Backup Vocals:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {song.players?.backupVocals?.map((player, playerIndex) => (
                      <span key={playerIndex} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-900/40 text-emerald-200 text-xs rounded-full font-medium border border-emerald-700/50">
                        {player}
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => removePlayerFromInstrument(song.id, 'backupVocals', player)}
                            className="text-emerald-400 hover:text-emerald-200 transition-colors"
                            title="Remove player"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {userRole === 'admin' && (
                      <button 
                        onClick={() => {
                          const name = prompt('Enter player name for Backup Vocals:');
                          if (name) addPlayerToInstrument(song.id, 'backupVocals', name);
                        }}
                        className="px-3 py-1 text-emerald-400 hover:bg-emerald-900/40 text-xs rounded-full border border-emerald-700/50 hover:border-emerald-600 transition-colors font-medium"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>

                {song.interestedPlayers.length > 0 && (
                  <div className="p-3 bg-slate-700/40 border border-slate-600 rounded-lg">
                    <div className="text-xs font-medium text-slate-400 mb-2">Legacy Interest List:</div>
                    <div className="flex flex-wrap gap-2">
                      {song.interestedPlayers.map((player, playerIndex) => (
                        <span
                          key={playerIndex}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-600/60 text-slate-300 text-xs rounded-full border border-slate-500"
                        >
                          <Users className="w-3 h-3" />
                          {player}
                          <button
                            onClick={() => removePlayerFromSong(song.id, player)}
                            className="text-slate-400 hover:text-slate-200"
                            title="Remove player"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      ↑ These can be moved to specific instruments
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
};

export default SongDurationTracker;
export {};