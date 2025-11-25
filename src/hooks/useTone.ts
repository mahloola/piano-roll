// hooks/useTone.ts
import type { Midi } from "@tonejs/midi";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import type { Part } from "tone";
import { PERCUSSION_CHANNEL } from "../utils/constants";
import type { Note } from "@tonejs/midi/dist/Note";

const VISUAL_FRAMERATE = 60;

const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: "sawtooth",
  },
  envelope: {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.3,
    release: 1,
  },
  volume: -10,
}).toDestination();

const transport = Tone.Transport;
export const getCurrentPlaybackTime = () => transport.seconds || 0;

export const useTone = () => {
  const partRef = useRef<Part | null>(null);

  const playMidi = (midiData: Midi) => {
    if (!synth || !transport) {
      console.warn("❌ Audio not available - visualization only");
      return;
    }

    try {
      transport.stop();
      if (partRef.current) {
        partRef.current.stop();
      }

      const allNotes = midiData.tracks
        .filter((track) => track.channel !== PERCUSSION_CHANNEL)
        .flatMap((track) => track.notes);

      partRef.current = new Tone.Part(
        (time, note) => {
          const midiNote = note as Note;

          synth!.triggerAttackRelease(
            midiNote.name,
            midiNote.duration,
            time,
            midiNote.velocity,
          );
        },
        allNotes.map((note) => [note.time, note]),
      );
      partRef.current.start(0);
      transport.start();
    } catch (error) {
      console.error("❌ Error playing MIDI:", error);
    }
  };

  const stopMidi = () => {
    transport.stop();
    transport.cancel();
    if (partRef.current) partRef.current.stop();
    synth.releaseAll();
  };

  const pauseMidi = () => {
    transport.pause();
    synth.releaseAll();
  };

  const resumeMidi = () => {
    transport.start();
    if (partRef.current) partRef.current.start(0);
  };

  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeSeconds(transport?.seconds || 0);
    }, 1000 / VISUAL_FRAMERATE);
    return () => clearInterval(interval);
  }, []);

  return {
    currentTimeSeconds,
    transport,
    playMidi,
    stopMidi,
    pauseMidi,
    resumeMidi,
  };
};
