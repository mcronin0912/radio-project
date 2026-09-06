"use client";

import { useRef, useEffect, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";

const BAR_COUNT = 48;
const BAR_GAP = 2;
const MIN_BAR_HEIGHT = 2;
const HALF = BAR_COUNT / 2;
/** Waveform uses Mist (#d0d6e0) — monochrome chrome; acid-lime is reserved for CTAs. */
const WAVE_COLOR = { r: 208, g: 214, b: 224 };

function waveColor(alpha: number): string {
  return `rgba(${WAVE_COLOR.r}, ${WAVE_COLOR.g}, ${WAVE_COLOR.b}, ${alpha})`;
}

function mirrorIndex(i: number): number {
  return i < HALF ? HALF - 1 - i : i - HALF;
}

export function WaveformVisualizer() {
  const { isPlaying, volume, analyser } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const freqBuf = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const phaseRef = useRef(0);
  const simBarsRef = useRef<Float32Array>(new Float32Array(HALF));

  const draw = useCallback(() => {
    rafRef.current = requestAnimationFrame(draw);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    if (!isPlaying) {
      drawIdleBars(ctx, w, h);
      return;
    }

    let hasRealData = false;
    if (analyser) {
      if (!freqBuf.current || freqBuf.current.length !== analyser.frequencyBinCount) {
        freqBuf.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(freqBuf.current);
      hasRealData = freqBuf.current.some((v) => v > 0);
    }

    if (hasRealData) {
      drawRealBars(ctx, freqBuf.current!, analyser!.frequencyBinCount, w, h);
    } else {
      drawSimBars(ctx, w, h, volume, phaseRef, simBarsRef);
    }
  }, [isPlaying, volume, analyser]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="h-8 w-full opacity-90"
      aria-hidden
    />
  );
}

function drawIdleBars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const barWidth = (w - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;
  const midY = h / 2;
  ctx.fillStyle = waveColor(0.25);
  for (let i = 0; i < BAR_COUNT; i++) {
    const x = i * (barWidth + BAR_GAP);
    ctx.beginPath();
    ctx.roundRect(x, midY - MIN_BAR_HEIGHT / 2, barWidth, MIN_BAR_HEIGHT, 1);
    ctx.fill();
  }
}

function drawRealBars(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  bufLen: number,
  w: number,
  h: number
) {
  const barWidth = (w - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;
  const midY = h / 2;
  const step = Math.max(1, Math.floor(bufLen / HALF));

  const values = new Float32Array(HALF);
  for (let k = 0; k < HALF; k++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += data[k * step + j];
    values[k] = sum / step / 255;
  }

  for (let i = 0; i < BAR_COUNT; i++) {
    const avg = values[mirrorIndex(i)];
    const barH = Math.max(MIN_BAR_HEIGHT, avg * h * 0.9);
    ctx.fillStyle = waveColor(0.55 + avg * 0.45);
    const x = i * (barWidth + BAR_GAP);
    ctx.beginPath();
    ctx.roundRect(x, midY - barH / 2, barWidth, barH, barWidth / 2);
    ctx.fill();
  }
}

function drawSimBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vol: number,
  phaseRef: React.MutableRefObject<number>,
  barsRef: React.MutableRefObject<Float32Array>
) {
  phaseRef.current += 0.04;
  const phase = phaseRef.current;
  const bars = barsRef.current;
  const barWidth = (w - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;
  const midY = h / 2;

  for (let k = 0; k < HALF; k++) {
    const norm = k / HALF;
    const target =
      (Math.sin(phase + norm * 6) * 0.3 +
        Math.sin(phase * 1.7 + norm * 4) * 0.25 +
        Math.sin(phase * 0.6 + norm * 9) * 0.15 +
        0.3) * vol;
    bars[k] += (target - bars[k]) * 0.15;
  }

  for (let i = 0; i < BAR_COUNT; i++) {
    const val = Math.max(0, Math.min(1, bars[mirrorIndex(i)]));
    const barH = Math.max(MIN_BAR_HEIGHT, val * h * 0.85);
    ctx.fillStyle = waveColor(0.45 + val * 0.55);
    const x = i * (barWidth + BAR_GAP);
    ctx.beginPath();
    ctx.roundRect(x, midY - barH / 2, barWidth, barH, barWidth / 2);
    ctx.fill();
  }
}
