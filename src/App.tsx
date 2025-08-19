import React, { useState, useEffect } from 'react';
import { Music, Plus, Download, Upload, Save, Users, X, Trash2, Guitar, Mic, Search, Database, Cloud, CloudOff } from 'lucide-react';
import { SongService } from './songService';
import type { DatabaseSong } from './supabaseClient';

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
}

const SongDurationTracker = () => {
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
    { id: 23, title: "Guest 3", duration: "4:00", interestedPlayers: [] },
    { id: 24, title: "Guest 4", duration: "4:00", interestedPlayers: [] }
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

  // Save to localStorage whenever songs change
  useEffect(() => {
    localStorage.setItem('song-tracker-playlist', JSON.stringify(songs));
  }, [songs]);

  // Database sync functions
  const loadFromDatabase = async () => {
    setIsSyncing(true);
    try {
      const dbSongs = await SongService.getAllSongs();
      if (dbSongs.length > 0) {
        // Convert database songs to app format
        const convertedSongs = dbSongs.map(dbSong => ({
          id: dbSong.id,
          title: dbSong.title,
          duration: dbSong.duration,
          interestedPlayers: [], // Keep for legacy compatibility
          players: dbSong.players
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
    }
  };

  const saveToDatabase = async () => {
    setIsSyncing(true);
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
        }
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
    }
  };

  // Auto-save to database when songs change
  useEffect(() => {
    if (songs.length > 0) {
      const timeoutId = setTimeout(() => {
        saveToDatabase();
      }, 2000); // Auto-save 2 seconds after changes

      return () => clearTimeout(timeoutId);
    }
  }, [songs]);

  // Load from database on component mount
  useEffect(() => {
    loadFromDatabase();
    
    // Set up real-time subscription
    const subscription = SongService.subscribeToChanges((updatedSongs) => {
      const convertedSongs = updatedSongs.map(dbSong => ({
        id: dbSong.id,
        title: dbSong.title,
        duration: dbSong.duration,
        interestedPlayers: [],
        players: dbSong.players
      }));
      setSongs(convertedSongs);
      setLastSynced(new Date());
      console.log('🔄 Real-time update received');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fix common data issues in localStorage
  const fixDataIssues = () => {
    const updatedSongs = songs.map(song => {
      let fixedSong = { ...song };
      
      // Fix semicolon in duration (3;00 -> 3:00)
      if (fixedSong.duration && fixedSong.duration.includes(';')) {
        fixedSong.duration = fixedSong.duration.replace(/;/g, ':');
        console.log(`Fixed duration for "${fixedSong.title}": "${song.duration}" -> "${fixedSong.duration}"`);
      }
      
      return fixedSong;
    });
    
    setSongs(updatedSongs);
    localStorage.setItem('songs', JSON.stringify(updatedSongs));
    alert('Fixed data issues! Duration format corrected.');
  };

  // Debug function to find invalid durations
  const debugDurations = () => {
    console.log('=== DURATION DEBUG ===');
    const invalidSongs: Song[] = [];
    const validSongs: Song[] = [];
    
    songs.forEach((song: Song) => {
      if (song.duration && song.duration.trim()) {
        const [minutes, seconds] = song.duration.split(':').map(Number);
        if (!isNaN(minutes) && !isNaN(seconds)) {
          validSongs.push(song);
          console.log(`✅ Song ${song.id}: "${song.title}" - "${song.duration}" (Valid)`);
        } else {
          invalidSongs.push(song);
          console.log(`❌ Song ${song.id}: "${song.title}" - "${song.duration}" (Invalid format)`);
        }
      } else {
        invalidSongs.push(song);
        console.log(`⚪ Song ${song.id}: "${song.title}" - "${song.duration}" (Empty)`);
      }
    });
    
    console.log(`\nSUMMARY:`);
    console.log(`Total songs: ${songs.length}`);
    console.log(`Valid durations: ${validSongs.length}`);
    console.log(`Invalid/Empty durations: ${invalidSongs.length}`);
    
    if (invalidSongs.length > 0) {
      console.log(`\nSongs with issues:`);
      invalidSongs.forEach(song => {
        console.log(`- Song ${song.id}: "${song.title}" has duration: "${song.duration}"`);
      });
    }
    
    alert(`Found ${validSongs.length} valid durations out of ${songs.length} total songs. Check console for details.`);
  };
  const smartMigrationTo24Songs = () => {
    const savedSongs = localStorage.getItem('song-tracker-playlist');
    if (!savedSongs) return;
    
    try {
      const existingSongs = JSON.parse(savedSongs);
      console.log('Current songs in localStorage:', existingSongs.length);
      
      // Create a map of existing songs by ID for easy lookup
      const existingSongMap = new Map();
      existingSongs.forEach((song: any) => {
        existingSongMap.set(song.id, song);
      });
      
      // Start with the full 24-song default list
      const fullSongList = [...defaultSongs];
      
      // Merge existing data into the full list
      const mergedSongs = fullSongList.map((defaultSong: Song) => {
        const existingSong = existingSongMap.get(defaultSong.id);
        if (existingSong) {
          // Use existing data (preserves titles, durations, player assignments)
          return {
            ...defaultSong,
            ...existingSong,
            // Ensure interestedPlayers exists
            interestedPlayers: existingSong.interestedPlayers || [],
            // Preserve any players data
            players: existingSong.players || undefined
          };
        }
        // Use default song if no existing data
        return defaultSong;
      });
      
      console.log('Merged songs:', mergedSongs.length);
      setSongs(mergedSongs);
      alert(`Migration complete! Now have ${mergedSongs.length} songs with all player assignments preserved!`);
      
    } catch (error) {
      console.error('Migration failed:', error);
      alert('Migration failed. Please try the reset option as backup.');
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
  setSongs(songs.map((song: Song) => 
    song.id === id ? { ...song, [field]: value } : song
  ));
};

  const addSong = () => {
    const newId = Math.max(...songs.map((s: Song) => s.id)) + 1;
    setSongs([...songs, { id: newId, title: "", duration: "", interestedPlayers: [] }]);
  };

  const deleteSong = (id: number) => {
    setSongs(songs.filter((song: Song) => song.id !== id));
  };

  // Add a player to a song's interested list
  const addPlayerToSong = (songId: number, playerName: string) => {
    console.log('Adding player:', playerName, 'to song:', songId);
    if (!playerName.trim()) return;
    
    setSongs(songs.map((song: Song) => 
      song.id === songId 
        ? { ...song, interestedPlayers: [...song.interestedPlayers, playerName.trim()] }
        : song
    ));
  };

  // Add a player to a specific instrument for a song
  const addPlayerToInstrument = (songId: number, instrument: string, playerName: string) => {
    if (!playerName.trim()) return;
    
    setSongs(songs.map((song: Song) => {
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
    }));
  };

  // Remove a player from a specific instrument
  const removePlayerFromInstrument = (songId: number, instrument: string, playerName: string) => {
    setSongs(songs.map((song: Song) => {
      if (song.id !== songId || !song.players) return song;
      
      return {
        ...song,
        players: {
          ...song.players,
          [instrument]: song.players[instrument as keyof typeof song.players]?.filter(player => player !== playerName) || []
        }
      };
    }));
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

  // Export playlist as JSON for sharing
  const exportToJSON = () => {
    const playlistData = {
      exportDate: new Date().toISOString(),
      totalSongs: songs.length,
      songs: songs
    };
    
    const jsonContent = JSON.stringify(playlistData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'song-playlist.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Import playlist from JSON file
  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Handle different JSON formats
          let importedSongs;
          if (data.songs && Array.isArray(data.songs)) {
            importedSongs = data.songs; // Our export format
          } else if (Array.isArray(data)) {
            importedSongs = data; // Simple array format
          } else {
            throw new Error('Invalid file format');
          }
          
          // Validate the data has required fields and add missing interestedPlayers
          const validSongs = importedSongs.filter((song: any) => 
            song.id && typeof song.title === 'string'
          ).map((song: any) => ({
            ...song,
            interestedPlayers: song.interestedPlayers || []
          })) as Song[];
          
          if (validSongs.length > 0) {
            setSongs(validSongs);
            alert(`Successfully imported ${validSongs.length} songs!`);
          } else {
            alert('No valid songs found in the file.');
          }
        } catch (error) {
          alert('Error reading file. Please make sure it\'s a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
    // Reset the input
    event.target.value = '';
  };

  // Reset to default playlist
  const resetPlaylist = () => {
    if (window.confirm('Are you sure you want to reset to the default playlist? This will clear all your changes.')) {
      setSongs(defaultSongs);
      localStorage.removeItem('song-tracker-playlist');
    }
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
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Music className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Massey Hall Song List November 15 2025</h1>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Total Playlist Time</div>
              <div className="text-2xl font-bold text-blue-900">{formatTotalTime()}</div>
              <div className="text-sm text-blue-600">{totalTime.songsWithTime} of {songs.length} songs timed</div>
            </div>
            
            <div className={`border rounded-lg p-4 ${isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                {isSyncing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-blue-600">Syncing...</span>
                  </>
                ) : isOnline ? (
                  <>
                    <Cloud className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Offline</span>
                  </>
                )}
              </div>
              {lastSynced && (
                <div className="text-xs text-gray-500 mt-1">
                  Last synced: {lastSynced.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={addSong}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Song
            </button>
            <button
              onClick={loadFromDatabase}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              Sync Now
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Export JSON
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={importFromJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 w-20">Song #</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Title & Players</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 w-32">Duration (M:SS)</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 w-20">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {songs.map((song: Song, index: number) => (
              <tr key={song.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {song.id}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    {/* Song title input */}
                    <input
                      type="text"
                      value={song.title}
                      onChange={(e) => updateSong(song.id, 'title', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter song title..."
                    />
                    
                    {/* Players section - NEW INSTRUMENT-BASED MOCKUP */}
                    <div className="space-y-2 mt-2">
                      <div className="text-xs font-medium text-gray-600 mb-2">Band Members by Instrument:</div>
                      
                      {/* Electric Guitar */}
                      <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                        <Guitar className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-medium text-red-700 min-w-[80px]">Electric:</span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {/* Show actual players from data */}
                          {song.players?.electricGuitar?.map((player, playerIndex) => (
                            <span key={playerIndex} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {player}
                              <button 
                                onClick={() => removePlayerFromInstrument(song.id, 'electricGuitar', player)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove player"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <button 
                            onClick={() => {
                              const name = prompt('Enter player name for Electric Guitar:');
                              if (name) addPlayerToInstrument(song.id, 'electricGuitar', name);
                            }}
                            className="px-2 py-1 text-red-600 hover:bg-red-100 text-xs rounded border border-red-300 hover:border-red-400"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Acoustic Guitar */}
                      <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                        <Guitar className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700 min-w-[80px]">Acoustic:</span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {song.players?.acousticGuitar?.map((player, playerIndex) => (
                            <span key={playerIndex} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              {player}
                              <button 
                                onClick={() => removePlayerFromInstrument(song.id, 'acousticGuitar', player)}
                                className="text-orange-600 hover:text-orange-800"
                                title="Remove player"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <button 
                            onClick={() => {
                              const name = prompt('Enter player name for Acoustic Guitar:');
                              if (name) addPlayerToInstrument(song.id, 'acousticGuitar', name);
                            }}
                            className="px-2 py-1 text-orange-600 hover:bg-orange-100 text-xs rounded border border-orange-300 hover:border-orange-400"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Bass */}
                      <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded">
                        <Guitar className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700 min-w-[80px]">Bass:</span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {song.players?.bass?.map((player, playerIndex) => (
                            <span key={playerIndex} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              {player}
                              <button 
                                onClick={() => removePlayerFromInstrument(song.id, 'bass', player)}
                                className="text-purple-600 hover:text-purple-800"
                                title="Remove player"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <button 
                            onClick={() => {
                              const name = prompt('Enter player name for Bass:');
                              if (name) addPlayerToInstrument(song.id, 'bass', name);
                            }}
                            className="px-2 py-1 text-purple-600 hover:bg-purple-100 text-xs rounded border border-purple-300 hover:border-purple-400"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Vocals */}
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <Mic className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700 min-w-[80px]">Vocals:</span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {song.players?.vocals?.map((player, playerIndex) => (
                            <span key={playerIndex} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {player}
                              <button 
                                onClick={() => removePlayerFromInstrument(song.id, 'vocals', player)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Remove player"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <button 
                            onClick={() => {
                              const name = prompt('Enter player name for Vocals:');
                              if (name) addPlayerToInstrument(song.id, 'vocals', name);
                            }}
                            className="px-2 py-1 text-blue-600 hover:bg-blue-100 text-xs rounded border border-blue-300 hover:border-blue-400"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Backup Vocals */}
                      <div className="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded">
                        <Mic className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-medium text-teal-700 min-w-[80px]">Backup:</span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {song.players?.backupVocals?.map((player, playerIndex) => (
                            <span key={playerIndex} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">
                              {player}
                              <button 
                                onClick={() => removePlayerFromInstrument(song.id, 'backupVocals', player)}
                                className="text-teal-600 hover:text-teal-800"
                                title="Remove player"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <button 
                            onClick={() => {
                              const name = prompt('Enter player name for Backup Vocals:');
                              if (name) addPlayerToInstrument(song.id, 'backupVocals', name);
                            }}
                            className="px-2 py-1 text-teal-600 hover:bg-teal-100 text-xs rounded border border-teal-300 hover:border-teal-400"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Old system data preservation */}
                      {song.interestedPlayers.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
                          <div className="text-xs font-medium text-gray-600 mb-1">Legacy Interest List:</div>
                          <div className="flex flex-wrap gap-1">
                            {song.interestedPlayers.map((player, playerIndex) => (
                              <span
                                key={playerIndex}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                <Users className="w-3 h-3" />
                                {player}
                                <button
                                  onClick={() => removePlayerFromSong(song.id, player)}
                                  className="text-gray-500 hover:text-gray-700"
                                  title="Remove player"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ↑ These can be moved to specific instruments
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={song.duration}
                    onChange={(e) => updateSong(song.id, 'duration', e.target.value)}
                    className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="4:35"
                    pattern="[0-9]+:[0-5][0-9]"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => deleteSong(song.id)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Delete song"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Click on any cell to edit song titles or durations</li>
          <li>• Enter durations in M:SS format (e.g., 4:35 for 4 minutes 35 seconds)</li>
          <li>• Total time updates automatically as you add durations</li>
          <li>• Use "Add Song" to add new songs to your playlist</li>
          <li>• Click "Export CSV" to download your playlist for use in Excel or Google Sheets</li>
          <li>• Times already found: Satellite of Love (3:37), After Midnight (2:29), Reelin' in the Years (4:35), Friday I'm in Love (3:34), Layla (7:10)</li>
        </ul>
      </div>
    </div>
  );
};

export default SongDurationTracker;