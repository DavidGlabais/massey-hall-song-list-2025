import { SongService } from './songService';

// Data from your CSV backup
const tempoGrooveData = [
  { id: 1, tempo: "120bpm", groove: "G" },
  { id: 2, tempo: "102bpm", groove: "G minor" },
  { id: 4, tempo: "136bpm", groove: "D" },
  { id: 5, tempo: "124", groove: "D minor" },
  { id: 6, tempo: "94bpm", groove: "Db" },
  { id: 7, tempo: "126bpm", groove: "Bb" },
  { id: 8, tempo: "147bpm", groove: "G# minor" },
  { id: 9, tempo: "94bpm", groove: "TBA" },
  { id: 14, tempo: "116bpm", groove: "C" },
  { id: 15, tempo: "118bpm", groove: "Eb" },
  { id: 16, tempo: "112bpm", groove: "D" },
  { id: 17, tempo: "105bpm", groove: "C" },
  { id: 20, tempo: "105bpm", groove: "E" },
  { id: 21, tempo: "129bpm", groove: "A" }
];

// Function to restore the data
async function restoreData() {
  console.log("Starting tempo and groove data restoration...");
  const result = await SongService.restoreTempoAndGroove(tempoGrooveData);
  if (result) {
    console.log("Successfully restored tempo and groove data!");
  } else {
    console.log("Failed to restore data. Check the console for errors.");
  }
}

// Run the restoration
restoreData();
