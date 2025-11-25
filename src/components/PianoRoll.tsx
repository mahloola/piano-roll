// components/PianoRollFalling.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { usePianoRoll } from "../hooks/usePianoRoll";
import { getCurrentPlaybackTime, useTone } from "../hooks/useTone";
import { supabase } from "../supabaseClient";
import useSWR from "swr";
import { Midi } from "@tonejs/midi";

enum PlaybackStatus {
  Stopped = "Stopped",
  Playing = "Playing",
  Paused = "Paused",
}

const PianoRollFalling: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { session } = UserAuth();
  const userId = session?.user?.id;
  const { uploadId } = useParams();
  const {
    data: fileRecord,
    isLoading: fileRecordLoading,
    error: fileRecordError,
  } = useSWR(
    ["files" as const, userId, uploadId],
    async ([collection, userId, fileId]) => {
      const { data: file, error: fileError } = await supabase
        .from(collection)
        .select("*")
        .eq("user_id", userId)
        .eq("id", fileId)
        .single();
      if (fileError) throw fileError;
      return file;
    },
  );

  const {
    data: midi,
    isLoading: midiLoading,
    error: midiError,
  } = useSWR(
    fileRecord ? ["midi-files" as const, fileRecord?.file_path] : undefined,
    async ([collection, filePath]) => {
      const { data: blob, error: storageError } = await supabase.storage
        .from(collection)
        .download(filePath);
      if (storageError) throw new Error("Failed to download file");
      try {
        const buffer = await blob.arrayBuffer();
        return new Midi(buffer);
      } catch (error) {
        console.error("Error parsing MIDI file:", error);
        throw error;
      }
    },
  );

  const loading = fileRecordLoading || midiLoading;
  const error = fileRecordError || midiError;

  const { currentTimeSeconds, playMidi, pauseMidi, resumeMidi, stopMidi } =
    useTone();

  useEffect(() => {
    return () => {
      stopMidi(); // Stop MIDI playback when leaving the page
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { drawPianoRoll, resizeCanvas } = usePianoRoll(canvasRef, midi);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [!canvasRef.current, resizeCanvas]);

  // Animation loop
  const animationRef = useRef<number>(0);
  useEffect(() => {
    if (!canvasRef.current) return;

    const animate = () => {
      drawPianoRoll(getCurrentPlaybackTime());
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [drawPianoRoll]);

  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>(
    PlaybackStatus.Stopped,
  );
  const handlePlay = async () => {
    if (!midi) throw new Error("Expected MIDI data");
    setPlaybackStatus(PlaybackStatus.Playing);
    try {
      playMidi(midi);
      console.log("MIDI playback started");
    } catch (err) {
      console.error("Error playing MIDI:", err);
      setPlaybackStatus(PlaybackStatus.Stopped);
    }
  };
  const handleStop = () => {
    stopMidi();
    setPlaybackStatus(PlaybackStatus.Stopped);
  };

  const handlePause = () => {
    pauseMidi();
    setPlaybackStatus(PlaybackStatus.Paused);
  };
  const handleResume = () => {
    resumeMidi();
    setPlaybackStatus(PlaybackStatus.Playing);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => navigate("/uploads")}
              className="text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-2"
            >
              ← Back to Uploads
            </button>
            {!loading && !error && (
              <>
                <h2 className="text-2xl font-bold">{fileRecord.filename}</h2>
                <p className="text-sm text-gray-400">
                  Time: {currentTimeSeconds.toFixed(1)}s | Status:{" "}
                  {playbackStatus} | MIDI: Loaded
                </p>
              </>
            )}
            {loading && (
              <p className="text-3xl text-gray-400 mb-4">Loading...</p>
            )}
            {error && (
              <p className="text-xl text-red-400 mb-4">
                {error?.message ?? JSON.stringify(error)}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:pt-8">
            {playbackStatus === PlaybackStatus.Stopped && (
              <button
                onClick={handlePlay}
                disabled={!midi || loading || error}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Play
              </button>
            )}
            {playbackStatus === PlaybackStatus.Playing && (
              <button onClick={handlePause}>Pause</button>
            )}
            {playbackStatus === PlaybackStatus.Paused && (
              <button onClick={handleResume}>Resume</button>
            )}
            <button
              onClick={handleStop}
              disabled={playbackStatus === PlaybackStatus.Stopped}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              Stop
            </button>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full bg-gray-800 rounded border border-gray-700"
          style={{ height: "500px" }}
        />
      </div>
    </div>
  );
};

export default PianoRollFalling;
