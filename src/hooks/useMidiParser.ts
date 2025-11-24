// hooks/useMidiParser.ts
import { Midi } from '@tonejs/midi';
import { useCallback, useState } from 'react';

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

  const createKeyMap = (data: MidiData) => {
    const newKeyMap: KeyMap = {};

    for (let i = 21; i < 109; i++) {
      newKeyMap[i] = [];
    }

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

  const parseMidiFile = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      const uint8Array = new Uint8Array(arrayBuffer);

      const midi = new Midi(uint8Array);

      const tracks: MidiTrack[] = midi.tracks.map((track) => ({
        notes: track.notes.map((note) => ({
          time: note.time,
          duration: note.duration,
          name: note.name,
          velocity: note.velocity,
          midi: note.midi,
        })),
        isPercussion: track.channel === 9,
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
  }, []);

  return {
    parseMidiFile,
    midiData,
    keyMap,
  };
};
