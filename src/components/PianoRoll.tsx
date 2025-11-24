// components/PianoRollFalling.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { useMidiParser } from '../hooks/useMidiParser';
import { usePianoRoll } from '../hooks/usePianoRoll';
import { useTone } from '../hooks/useTone';
import { supabase } from '../supabaseClient';

const PianoRollFalling: React.FC = () => {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const { session } = UserAuth();
  const { initTone, playMidi, pauseMidi, resumeMidi, stopMidi, isToneReady } =
    useTone();
  const { initPianoRoll, drawPianoRoll, resizeCanvas } =
    usePianoRoll(canvasRef);
  const { parseMidiFile, midiData, keyMap } = useMidiParser();

  // Fetch MIDI file
  const fetchMidiFile = useCallback(async () => {
    if (!uploadId || !session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get file metadata
      const { data: fileData, error: dbError } = await supabase
        .from('files')
        .select('*')
        .eq('id', uploadId)
        .eq('user_id', session.user.id)
        .single();

      if (dbError) throw new Error('File not found');
      if (!fileData) throw new Error('No file data');

      // Download file from storage
      const { data: fileBlob, error: storageError } = await supabase.storage
        .from('midi-files')
        .download(fileData.file_path);

      if (storageError) throw new Error('Failed to download file');

      // Convert to File object
      const file = new File([fileBlob], fileData.filename, {
        type: 'audio/midi',
      });
      setMidiFile(file);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load file';
      setError(message);
      console.error('Error fetching MIDI:', err);
    } finally {
      setLoading(false);
    }
  }, [uploadId, session]);

  const initWhenReady = () => {
    if (!canvasRef.current) {
      requestAnimationFrame(initWhenReady);
      return;
    }
    initTone();
    initPianoRoll();
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  // Initialize
  useEffect(() => {
    fetchMidiFile();
  }, []);

  useEffect(() => {
    initWhenReady();
  }, []);

  // Parse MIDI when ready
  useEffect(() => {
    if (midiFile && isToneReady) {
      parseMidiFile(midiFile);
    }
  }, [midiFile, isToneReady, parseMidiFile]);

  // Animation loop
  useEffect(() => {
    if (!keyMap || !isPlaying) {
      setCurrentTime(0);
      if (keyMap) drawPianoRoll(keyMap, false, 0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }
    if (isPaused) return;

    startTimeRef.current = Date.now() - currentTime * 1000;

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setCurrentTime(elapsed);
      drawPianoRoll(keyMap, true, elapsed);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [keyMap, isPlaying, isPaused]);

  const handlePlay = useCallback(async () => {
    console.log('Play clicked:', { midiData: !!midiData, isToneReady });

    if (!midiData) {
      console.log('No MIDI data available');
      return;
    }

    setIsPlaying(true);

    if (isToneReady) {
      try {
        await playMidi(midiData);
        console.log('MIDI playback started');
      } catch (err) {
        console.error('Error playing MIDI:', err);
        setIsPlaying(false);
      }
    } else {
      console.log('Tone.js not ready - visualization only');
    }
  }, [midiData, isToneReady, playMidi]);

  const handleStop = useCallback(() => {
    console.log('Stop clicked');
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
    stopMidi();
  }, [stopMidi]);

  const handlePause = useCallback(() => {
    if (isPaused) {
      resumeMidi();
      setIsPaused(false);
    } else {
      pauseMidi();
      setIsPaused(true);
    }
  }, [isPaused, resumeMidi, pauseMidi]);

  const handleClose = () => navigate('/uploads');

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center'>
        <p className='text-xl'>Loading MIDI file...</p>
      </div>
    );
  }

  // Error state
  if (error || !midiFile) {
    const message = error ? `Error: ${error}` : 'No MIDI file found';
    return (
      <div className='min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-xl text-red-400 mb-4'>{message}</p>
          <button
            onClick={handleClose}
            className='bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded'
          >
            Back to Uploads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <button
              onClick={handleClose}
              className='text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-2'
            >
              ← Back to Uploads
            </button>
            <h2 className='text-2xl font-bold'>{midiFile.name}</h2>
            <p className='text-sm text-gray-400'>
              Time: {currentTime.toFixed(1)}s | Status:{' '}
              {isPlaying ? 'Playing' : 'Stopped'} | MIDI:{' '}
              {midiData ? 'Loaded' : 'Loading...'}
            </p>
          </div>

          {/* Controls */}
          <div className='flex flex-col sm:flex-row gap-2 sm:pt-8'>
            <button
              onClick={handlePlay}
              disabled={!midiData || isPlaying}
              className='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:bg-gray-600 disabled:cursor-not-allowed'
            >
              {isPlaying ? 'Playing...' : 'Play'}
            </button>
            <button
              onClick={handlePause}
              disabled={!isPlaying}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleStop}
              disabled={!isPlaying}
              className='bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded disabled:bg-gray-800 disabled:cursor-not-allowed'
            >
              Stop
            </button>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className='w-full bg-gray-800 rounded border border-gray-700'
          style={{ height: '500px' }}
        />
      </div>
    </div>
  );
};

export default PianoRollFalling;
