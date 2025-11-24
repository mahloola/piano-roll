// hooks/useMockMidiPlayer.ts
import { useState } from 'react';

interface MidiData {
  tracks: Array<{
    notes: Array<{
      time: number;
      duration: number;
      name: string;
      velocity: number;
    }>;
    isPercussion: boolean;
  }>;
  duration: number;
}

export const useMockMidiPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const playMidi = async (midiData: MidiData) => {
    setIsPlaying(true);
    const startTime = Date.now();

    const animate = () => {
      if (!isPlaying) return;

      const elapsed = (Date.now() - startTime) / 1000;
      setCurrentTime(elapsed);

      if (elapsed >= midiData.duration) {
        stopMidi();
      } else {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const stopMidi = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return {
    playMidi,
    stopMidi,
    isPlaying,
    currentTime,
  };
};
