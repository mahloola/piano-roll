// hooks/useMidiParser.ts
import { Midi } from '@tonejs/midi';
import { useState } from 'react';

interface MidiNote {
  time: number;
  duration: number;
  name: string;
  velocity: number;
  midi: number;
}

interface MidiTrack {
  notes: MidiNote[];
  isPercussion: boolean;
}

interface MidiData {
  tracks: MidiTrack[];
  duration: number;
}

interface KeyMap {
  [key: number]: Array<{ start: number; end: number }>;
}

export const useMidiParser = () => {
  const [midiData, setMidiData] = useState<MidiData | null>(null);
  const [keyMap, setKeyMap] = useState<KeyMap>({});

  const parseMidiFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Convert ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);

      // Parse MIDI data - the constructor accepts ArrayBuffer or Uint8Array
      const midi = new Midi(uint8Array);

      const tracks: MidiTrack[] = midi.tracks.map((track) => ({
        notes: track.notes.map((note) => ({
          time: note.time,
          duration: note.duration,
          name: note.name,
          velocity: note.velocity,
          midi: note.midi,
        })),
        isPercussion: track.channel === 9, // Channel 10 (0-indexed 9) is percussion
      }));

      const midiData: MidiData = {
        tracks,
        duration: midi.duration,
      };

      setMidiData(midiData);
      createKeyMap(midiData);
    } catch (error) {
      console.error('Error parsing MIDI file:', error);
    }
  };

  const createKeyMap = (data: MidiData) => {
    const newKeyMap: KeyMap = {};

    // Initialize key map
    for (let i = 21; i < 109; i++) {
      newKeyMap[i] = [];
    }

    // Fill key map with note data
    data.tracks.forEach((track) => {
      if (!track.isPercussion) {
        track.notes.forEach((note) => {
          newKeyMap[note.midi].push({
            start: note.time,
            end: note.time + note.duration,
          });
        });
      }
    });

    setKeyMap(newKeyMap);
  };

  return {
    parseMidiFile,
    midiData,
    keyMap,
  };
};
