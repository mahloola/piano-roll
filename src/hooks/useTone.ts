// hooks/useTone.ts
import { useRef, useState } from 'react';

interface MidiNote {
  time: number;
  duration: number;
  name: string;
  velocity: number;
}

interface MidiData {
  tracks: Array<{
    notes: MidiNote[];
    isPercussion: boolean;
  }>;
  duration: number;
}

export const useTone = () => {
  const [isToneReady, setIsToneReady] = useState(false);
  const [toneError, setToneError] = useState<string | null>(null);
  const synthRef = useRef<any>(null);
  const transportRef = useRef<any>(null);
  const partRef = useRef<any>(null);

  const initTone = async () => {
    try {
      if (typeof window === 'undefined') {
        setToneError('Tone.js can only run in browser environment');
        return;
      }

      let Tone;
      try {
        const toneModule = await import('tone');
        Tone = toneModule;
      } catch {
        console.warn('Tone.js not available, using mock mode');
        setToneError(
          'Tone.js not installed - running in visualization-only mode',
        );
        setIsToneReady(true);
        return;
      }

      // Create synth with better settings
      const polySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sawtooth',
        },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 1,
        },
      }).toDestination();

      polySynth.volume.value = -10;

      synthRef.current = polySynth;
      transportRef.current = Tone.Transport;
      setIsToneReady(true);

      console.log('Tone.js initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Tone.js:', error);
      setToneError('Failed to initialize audio engine');
      setIsToneReady(false);
    }
  };

  const playMidi = async (midiData: MidiData) => {
    if (!synthRef.current || !transportRef.current) {
      console.warn('Audio not available - visualization only');
      return;
    }

    try {
      const Tone = await import('tone');
      const Part = Tone.Part;
      transportRef.current.stop();
      if (partRef.current) {
        partRef.current.stop();
      }

      const allNotes: MidiNote[] = [];
      midiData.tracks.forEach((track) => {
        if (!track.isPercussion) {
          allNotes.push(...track.notes);
        }
      });

      partRef.current = new Part(
        (_time: number, note: MidiNote | number) => {
          const midiNote = note as MidiNote;
          synthRef.current.triggerAttackRelease(
            midiNote.name,
            midiNote.duration,
            midiNote,
            midiNote.velocity,
          );
        },
        allNotes.map((note) => [note.time, note]),
      );

      partRef.current.start(0);
      transportRef.current.start();
    } catch (error) {
      console.error('Error playing MIDI:', error);
    }
  };

  const stopMidi = () => {
    if (transportRef.current) {
      transportRef.current.stop();
      transportRef.current.cancel();
    }
    if (partRef.current) {
      partRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.releaseAll();
    }
  };

  const pauseMidi = () => {
    if (transportRef.current) {
      transportRef.current.pause();
    }

    if (partRef.current) {
      partRef.current.stop();
    }

    if (synthRef.current) {
      synthRef.current.releaseAll();
    }
  };

  const resumeMidi = () => {
    if (transportRef.current && partRef.current) {
      transportRef.current.start();
      partRef.current.start(0);
    }
  };

  return {
    initTone,
    playMidi,
    stopMidi,
    pauseMidi,
    resumeMidi,
    isToneReady,
    toneError,
  };
};
