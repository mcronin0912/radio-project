/**
 * Safari: createMediaElementSource returns silence for streaming audio
 * (WebKit bug, affects all origins). This fetches the proxied stream,
 * decodes MP3 chunks, and feeds decoded audio continuously to an
 * AnalyserNode via a queue of scheduled BufferSourceNodes.
 */

function findSync(data: Uint8Array, start = 0): number {
  for (let i = start; i < data.length - 1; i++) {
    if (data[i] === 0xff && (data[i + 1] & 0xe0) === 0xe0) return i;
  }
  return -1;
}

export class SafariAudioAnalyser {
  private ctx: AudioContext;
  private analyser: AnalyserNode;
  private abort: AbortController | null = null;
  private running = false;
  private nextTime = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  private scheduleBuffer(audioBuffer: AudioBuffer) {
    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);

    const now = this.ctx.currentTime;
    if (this.nextTime < now) this.nextTime = now;
    source.start(this.nextTime);
    this.nextTime += audioBuffer.duration;
  }

  async start(proxyUrl: string) {
    this.stop();
    this.running = true;
    this.abort = new AbortController();
    this.nextTime = this.ctx.currentTime + 0.2;

    try {
      const response = await fetch(proxyUrl, { signal: this.abort.signal });
      if (!response.body) return;

      const reader = response.body.getReader();
      let buf = new Uint8Array(0);
      let aligned = false;

      while (this.running) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new data
        const tmp = new Uint8Array(buf.length + value.length);
        tmp.set(buf);
        tmp.set(value, buf.length);
        buf = tmp;

        // Align to first MP3 frame
        if (!aligned) {
          const s = findSync(buf);
          if (s < 0) continue;
          if (s > 0) buf = buf.slice(s);
          aligned = true;
        }

        // Try to decode whenever we have >= 16KB
        while (buf.length >= 16384 && this.running) {
          // Find a sync word to split at (aim for ~16-32KB chunks)
          let splitAt = -1;
          for (let i = 16384; i < Math.min(buf.length - 1, 40000); i++) {
            if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
              splitAt = i;
              break;
            }
          }
          if (splitAt < 0) break;

          const chunk = buf.slice(0, splitAt);
          const rest = buf.slice(splitAt);

          try {
            const ab = chunk.buffer.slice(
              chunk.byteOffset,
              chunk.byteOffset + chunk.byteLength
            );
            const decoded = await this.ctx.decodeAudioData(ab);
            this.scheduleBuffer(decoded);
            buf = rest;
          } catch {
            // Skip to next sync word on failure
            const next = findSync(buf, 4);
            buf = next > 0 ? buf.slice(next) : new Uint8Array(0);
            aligned = buf.length > 0;
            break;
          }
        }

        // Safety: don't let buffer grow unbounded
        if (buf.length > 262144) {
          const s = findSync(buf, buf.length - 32768);
          buf = s > 0 ? buf.slice(s) : new Uint8Array(0);
          aligned = buf.length > 0;
        }
      }
    } catch (e: unknown) {
      const err = e as Error;
      if (err?.name !== "AbortError") {
        console.warn("[Safari analyser]", err?.message ?? e);
      }
    }
  }

  stop() {
    this.running = false;
    this.abort?.abort();
    this.abort = null;
  }
}
