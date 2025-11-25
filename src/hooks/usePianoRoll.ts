// hooks/usePianoRoll.ts
import { useCallback, useMemo, useRef } from "react";
import type { Midi } from "@tonejs/midi";
import type { Note } from "@tonejs/midi/dist/Note";
import { PERCUSSION_CHANNEL } from "../utils/constants";

interface Key {
  id: Note["midi"];
  position: number;
  color: "white" | "black";
}

interface MidiKeyMap {
  [keyId: Key["id"]]: { startSeconds: number; endSeconds: number }[];
}
const createMidiKeyMap = (data: Midi | undefined) => {
  if (!data) return undefined;
  const keyMap: MidiKeyMap = {};
  for (let i = 21; i < 109; i++) {
    keyMap[i] = [];
  }
  data.tracks
    .filter((track) => track.channel !== PERCUSSION_CHANNEL)
    .forEach((track) => {
      track.notes.forEach((note) => {
        keyMap[note.midi].push({
          startSeconds: note.time,
          endSeconds: note.time + note.duration,
        });
      });
    });
  return keyMap;
};

const createKeyboard = (): Key[] => {
  const keys: Key[] = [];
  for (let i = 21; i < 109; i++) {
    const pitchId = (i - 12) % 12;
    const octaveId = Math.floor((i - 12) / 12);
    let position = octaveId * 7 - 5;
    position += 0.5 * pitchId;
    if (pitchId > 4) position += 0.5;

    const color = Math.floor(position) === position ? "white" : "black";
    keys.push({ id: i, position, color });
  }
  return keys;
};
const keyboard = createKeyboard();

const PADDING_X = 32;
const PADDING_BOTTOM = 32;

const calculateDimensions = (canvas: HTMLCanvasElement) => {
  const keyboardWidth = Math.max(100, canvas.width - PADDING_X - PADDING_X);
  const keyboardHeight = (keyboardWidth / 52) * 6;
  const whiteKeyWidth = keyboardWidth / 52;
  const whiteKeyHeight = keyboardHeight;
  const blackKeyWidth = whiteKeyWidth * 0.5;
  const blackKeyHeight = (whiteKeyHeight * 5) / 8;
  const secondSize = (canvas.height - PADDING_BOTTOM - keyboardHeight) / 4;

  return {
    keyboardWidth,
    keyboardHeight,
    whiteKeyWidth,
    whiteKeyHeight,
    blackKeyWidth,
    blackKeyHeight,
    secondSize,
  };
};

export const usePianoRoll = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  midi: Midi | undefined,
) => {
  const midiKeyMap = useMemo(() => createMidiKeyMap(midi), [midi]);

  const dimensionsRef = useRef({
    keyboardWidth: 0,
    keyboardHeight: 0,
    whiteKeyWidth: 0,
    whiteKeyHeight: 0,
    blackKeyWidth: 0,
    blackKeyHeight: 0,
    secondSize: 0,
  });

  const resizeCanvas = () => {
    if (canvasRef.current?.parentElement) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      canvas.width = container?.clientWidth || 800;
      canvas.height = 500;
      dimensionsRef.current = calculateDimensions(canvas);
    }
  };

  const drawKeyboard = useCallback(
    (ctx: CanvasRenderingContext2D, currentTimeSeconds: number) => {
      const dims = dimensionsRef.current;
      const yPos = ctx.canvas.height - PADDING_BOTTOM - dims.whiteKeyHeight;

      const isKeyActive = (key: Key) => {
        const intervals = midiKeyMap?.[key.id] || [];
        return intervals.some(
          (interval) =>
            currentTimeSeconds >= interval.startSeconds &&
            currentTimeSeconds <= interval.endSeconds,
        );
      };

      keyboard
        .filter((key) => key.color === "white")
        .forEach((key) => {
          ctx.fillStyle = isKeyActive(key) ? "#0080ff" : "#ffffff";
          ctx.strokeStyle = "#808080";
          ctx.fillRect(
            PADDING_X + key.position * dims.whiteKeyWidth,
            yPos,
            dims.whiteKeyWidth,
            dims.whiteKeyHeight,
          );
          ctx.strokeRect(
            PADDING_X + key.position * dims.whiteKeyWidth,
            yPos,
            dims.whiteKeyWidth,
            dims.whiteKeyHeight,
          );
        });

      keyboard
        .filter((key) => key.color === "black")
        .forEach((key) => {
          ctx.fillStyle = isKeyActive(key) ? "#0080ff" : "#000000";
          ctx.strokeStyle = "#808080";
          ctx.fillRect(
            PADDING_X +
              key.position * dims.whiteKeyWidth +
              dims.blackKeyWidth / 2,
            yPos,
            dims.blackKeyWidth,
            dims.blackKeyHeight,
          );
          ctx.strokeRect(
            PADDING_X +
              key.position * dims.whiteKeyWidth +
              dims.blackKeyWidth / 2,
            yPos,
            dims.blackKeyWidth,
            dims.blackKeyHeight,
          );
        });
    },
    [midiKeyMap],
  );

  const drawIncomingNotes = useCallback(
    (ctx: CanvasRenderingContext2D, currentTimeSeconds: number) => {
      const dims = dimensionsRef.current;
      const judgementLineY =
        ctx.canvas.height - PADDING_BOTTOM - dims.keyboardHeight;
      const scrollSpeed = 400;
      const lookaheadSeconds = 4;

      keyboard.forEach((key) => {
        const visibleIntervals = (midiKeyMap?.[key.id] || [])
          .filter((interval) => interval.endSeconds > currentTimeSeconds)
          .filter(
            (interval) =>
              interval.startSeconds < currentTimeSeconds + lookaheadSeconds,
          );
        visibleIntervals.forEach((interval) => {
          const startDelta = interval.startSeconds - currentTimeSeconds;
          const endDelta = interval.endSeconds - currentTimeSeconds;

          const startY = judgementLineY - endDelta * scrollSpeed;
          const endY = Math.min(
            judgementLineY,
            judgementLineY - startDelta * scrollSpeed,
          );
          const height = Math.abs(endY - startY);

          const width =
            key.color === "white" ? dims.whiteKeyWidth : dims.blackKeyWidth;
          const startX =
            PADDING_X +
            key.position * dims.whiteKeyWidth +
            (key.color === "black" ? dims.blackKeyWidth / 2 : 0);
          ctx.fillStyle = key.color === "black" ? "#0040aa" : "#0080ff";
          ctx.fillRect(startX, startY, width, height);
        });
      });
    },
    [midiKeyMap],
  );

  const drawPianoRoll = useCallback(
    (currentTimeSeconds: number = 0) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // draw background
      ctx.fillStyle = "#202020";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (dimensionsRef.current.keyboardWidth > 0) {
        drawIncomingNotes(ctx, currentTimeSeconds);
        drawKeyboard(ctx, currentTimeSeconds);
      }
    },
    [canvasRef, drawIncomingNotes, drawKeyboard],
  );

  return {
    drawPianoRoll,
    resizeCanvas,
  };
};
