// hooks/usePianoRoll.ts
import { useCallback, useEffect, useRef, useState } from 'react';

interface Key {
  id: number;
  position: number;
  color: 'white' | 'black';
  active: boolean;
}

interface KeyMap {
  [key: number]: Array<{ start: number; end: number }>;
}

export const usePianoRoll = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) => {
  const [keys, setKeys] = useState<Key[]>([]);
  const [dimensions, setDimensions] = useState({
    keyboardWidth: 0,
    keyboardHeight: 0,
    whiteKeyWidth: 0,
    whiteKeyHeight: 0,
    blackKeyWidth: 0,
    blackKeyHeight: 0,
    secondSize: 0,
  });

  // Use refs for values that change frequently but don't need re-renders
  const keysRef = useRef<Key[]>([]);
  const dimensionsRef = useRef(dimensions);

  // Update refs when state changes
  useEffect(() => {
    keysRef.current = keys;
  }, [keys]);

  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

  const createKeys = useCallback(() => {
    const newKeys: Key[] = [];
    for (let i = 21; i < 109; i++) {
      const pitchId = (i - 12) % 12;
      const octaveId = Math.floor((i - 12) / 12);
      let position = octaveId * 7 - 5;
      position += 0.5 * pitchId;
      if (pitchId > 4) position += 0.5;

      const color = Math.floor(position) === position ? 'white' : 'black';
      newKeys.push({ id: i, position, color, active: false });
    }
    setKeys(newKeys);
    keysRef.current = newKeys;
  }, []);

  const calculateDimensions = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const paddingBottom = 32;
    const paddingLeft = 32;
    const paddingRight = 32;

    const keyboardWidth = Math.max(
      100,
      canvas.width - paddingLeft - paddingRight,
    );
    const keyboardHeight = (keyboardWidth / 52) * 6;
    const whiteKeyWidth = keyboardWidth / 52;
    const whiteKeyHeight = keyboardHeight;
    const blackKeyWidth = whiteKeyWidth * 0.5;
    const blackKeyHeight = (whiteKeyHeight * 5) / 8;
    const secondSize = (canvas.height - paddingBottom - keyboardHeight) / 4;

    const newDimensions = {
      keyboardWidth,
      keyboardHeight,
      whiteKeyWidth,
      whiteKeyHeight,
      blackKeyWidth,
      blackKeyHeight,
      secondSize,
    };

    setDimensions(newDimensions);
    dimensionsRef.current = newDimensions;
  };

  const initPianoRoll = () => {
    createKeys();
    calculateDimensions();
  };

  const resizeCanvas = () => {
    if (canvasRef.current?.parentElement) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      canvas.width = container?.clientWidth || 800;
      canvas.height = 500;
      calculateDimensions();
    }
  };

  const updateKeyActivity = useCallback(
    (currentTime: number, keyMap: KeyMap) => {
      const updatedKeys = keysRef.current.map((key) => {
        const intervals = keyMap[key.id] || [];
        const isActive = intervals.some(
          (interval) =>
            currentTime >= interval.start && currentTime <= interval.end,
        );
        return { ...key, active: isActive };
      });
      setKeys(updatedKeys);
    },
    [],
  );

  const drawKeyboard = useCallback((ctx: CanvasRenderingContext2D) => {
    const dims = dimensionsRef.current;
    const currentKeys = keysRef.current;
    const yPos = ctx.canvas.height - 32 - dims.whiteKeyHeight;

    // Draw white keys
    currentKeys.forEach((key) => {
      if (key.color === 'white') {
        ctx.fillStyle = key.active ? '#0080ff' : '#ffffff';
        ctx.strokeStyle = '#808080';
        ctx.fillRect(
          32 + key.position * dims.whiteKeyWidth,
          yPos,
          dims.whiteKeyWidth,
          dims.whiteKeyHeight,
        );
        ctx.strokeRect(
          32 + key.position * dims.whiteKeyWidth,
          yPos,
          dims.whiteKeyWidth,
          dims.whiteKeyHeight,
        );
      }
    });

    // Draw black keys
    currentKeys.forEach((key) => {
      if (key.color === 'black') {
        ctx.fillStyle = key.active ? '#0080ff' : '#000000';
        ctx.strokeStyle = '#808080';
        ctx.fillRect(
          32 + key.position * dims.whiteKeyWidth + dims.blackKeyWidth / 2,
          yPos,
          dims.blackKeyWidth,
          dims.blackKeyHeight,
        );
        ctx.strokeRect(
          32 + key.position * dims.whiteKeyWidth + dims.blackKeyWidth / 2,
          yPos,
          dims.blackKeyWidth,
          dims.blackKeyHeight,
        );
      }
    });
  }, []);

  const drawIncomingNotes = useCallback(
    (ctx: CanvasRenderingContext2D, currentTime: number, keyMap: KeyMap) => {
      const dims = dimensionsRef.current;
      const currentKeys = keysRef.current;
      const incomingNotesHeight =
        ctx.canvas.height - 32 - dims.keyboardHeight - 4;
      const lookAheadTime = 4;

      ctx.fillStyle = '#0080ff';

      currentKeys.forEach((key) => {
        const intervals = keyMap[key.id] || [];
        intervals.forEach((interval) => {
          const noteStartTime = interval.start;
          const noteEndTime = interval.end;
          const startY =
            incomingNotesHeight -
            ((noteStartTime - currentTime) / lookAheadTime) *
              incomingNotesHeight;
          const endY =
            incomingNotesHeight -
            ((noteEndTime - currentTime) / lookAheadTime) * incomingNotesHeight;

          if (endY < 0 || startY > incomingNotesHeight) return;

          const visibleStartY = Math.max(0, startY);
          const visibleEndY = Math.min(incomingNotesHeight, endY);
          const height = Math.max(1, visibleEndY - visibleStartY);

          if (key.color === 'white') {
            ctx.fillRect(
              32 + key.position * dims.whiteKeyWidth,
              visibleStartY,
              dims.whiteKeyWidth,
              height,
            );
          } else {
            ctx.fillRect(
              32 + key.position * dims.whiteKeyWidth + dims.blackKeyWidth / 2,
              visibleStartY,
              dims.blackKeyWidth,
              height,
            );
          }
        });
      });
    },
    [],
  );

  const drawPianoRoll = (
    keyMap: KeyMap,
    _isPlaying: boolean,
    currentTime: number = 0,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Only draw if we have valid dimensions
    if (dimensionsRef.current.keyboardWidth > 0) {
      updateKeyActivity(currentTime, keyMap);
      drawIncomingNotes(ctx, currentTime, keyMap);
      drawKeyboard(ctx);
    }
  };

  return {
    initPianoRoll,
    drawPianoRoll,
    resizeCanvas,
  };
};
