"use client";

import { useRef, useEffect, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";

const BAR_COUNT = 48;
const BAR_GAP = 2;
const MIN_BAR_HEIGHT = 2;

export function WaveformVisualizer() {
  const { isPlaying, volume, analyser } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const freqBuf = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const phaseRef = useRef(0);
  const simBarsRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));

  const draw = useCallback(() => {
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
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // Try real analyser data
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

    rafRef.current = requestAnimationFrame(draw);
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
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
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
  const step = Math.floor(bufLen / BAR_COUNT);

  for (let i = 0; i < BAR_COUNT; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += data[i * step + j];
    const avg = sum / step / 255;
    const barH = Math.max(MIN_BAR_HEIGHT, avg * h * 0.9);
    const hue = 142 + avg * 40;
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${0.5 + avg * 0.5})`;
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

  for (let i = 0; i < BAR_COUNT; i++) {
    const norm = i / BAR_COUNT;
    const target =
      (Math.sin(phase + norm * 6) * 0.3 +
        Math.sin(phase * 1.7 + norm * 4) * 0.25 +
        Math.sin(phase * 0.6 + norm * 9) * 0.15 +
        0.3) * vol;
    bars[i] += (target - bars[i]) * 0.15;
    const val = Math.max(0, Math.min(1, bars[i]));
    const barH = Math.max(MIN_BAR_HEIGHT, val * h * 0.85);
    const hue = 142 + val * 40;
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${0.4 + val * 0.5})`;
    const x = i * (barWidth + BAR_GAP);
    ctx.beginPath();
    ctx.roundRect(x, midY - barH / 2, barWidth, barH, barWidth / 2);
    ctx.fill();
  }
}
