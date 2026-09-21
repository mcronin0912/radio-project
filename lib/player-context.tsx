"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import Hls from "hls.js";
import type { Station } from "@/lib/stations";
import type { Channel } from "@/lib/channels";
import { SafariAudioAnalyser } from "@/lib/safari-audio-analyser";
import { isHlsUrl, streamPlaybackUrl } from "@/lib/stream-url";

const STORAGE_KEY = "community-radio-player";
const TV_STORAGE_KEY = "community-tv-player";

export type MediaKind = "radio" | "tv";

export type PlaybackMedia =
  | { kind: "radio"; station: Station }
  | { kind: "tv"; channel: Channel };

type VideoHostId = "modal" | "bar";

function isSafari() {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function persistRadio(s: Station | null, playing: boolean) {
  if (typeof window === "undefined") return;
  if (!s || !playing) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: s.id,
      slug: s.slug,
      name: s.name,
      city: s.city,
      state: s.state,
      streamUrl: s.streamUrl,
    })
  );
}

function persistTv(c: Channel | null, playing: boolean) {
  if (typeof window === "undefined") return;
  if (!c || !playing) {
    sessionStorage.removeItem(TV_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(
    TV_STORAGE_KEY,
    JSON.stringify({
      slug: c.slug,
      channelId: c.channelId,
      name: c.name,
      network: c.network,
      streamUrl: c.streamUrl,
      logoUrl: c.logoUrl,
      categories: c.categories,
      state: c.state,
    })
  );
}

function restoreStation(): Station | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.streamUrl) return null;
    return {
      id: data.id ?? data.slug,
      slug: data.slug ?? "",
      callsign: "",
      name: data.name ?? "",
      frequency: null,
      city: data.city ?? "",
      state: data.state ?? "",
      description: null,
      website: null,
      streamUrl: data.streamUrl,
      streamFormat: null,
      streamBitrate: null,
      metadataTier: 0,
      metadataUrl: null,
      logoUrl: null,
      genres: [],
      indigenous: false,
    };
  } catch {
    return null;
  }
}

function restoreChannel(): Channel | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TV_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.streamUrl || !data?.slug) return null;
    return {
      slug: data.slug,
      channelId: data.channelId ?? data.slug,
      name: data.name ?? "",
      network: data.network ?? null,
      categories: Array.isArray(data.categories) ? data.categories : [],
      website: null,
      logoUrl: data.logoUrl ?? null,
      streamUrl: data.streamUrl,
      streamQuality: null,
      state: data.state ?? null,
      feed: null,
      label: null,
    };
  } catch {
    return null;
  }
}

interface PlayerState {
  /** @deprecated Prefer `media` — kept for radio UI compatibility */
  station: Station | null;
  media: PlaybackMedia | null;
  isPlaying: boolean;
  volume: number;
  error: string | null;
  isReconnecting: boolean;
  analyser: AnalyserNode | null;
  play: (station: Station) => void;
  playChannel: (channel: Channel) => void;
  pause: () => void;
  setVolume: (v: number) => void;
  clearError: () => void;
  registerVideoHost: (id: VideoHostId, el: HTMLElement | null) => void;
  setVideoModalOpen: (open: boolean) => void;
  videoModalOpen: boolean;
  requestVideoFullscreen: () => Promise<void>;
  getVideoElement: () => HTMLVideoElement | null;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [media, setMedia] = useState<PlaybackMedia | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoHomeRef = useRef<HTMLDivElement>(null);
  const videoHostsRef = useRef<Partial<Record<VideoHostId, HTMLElement | null>>>({});
  const hlsRef = useRef<Hls | null>(null);
  const chromeAnalyserRef = useRef<AnalyserNode | null>(null);

  // Create the <video> outside React's reconciler so appendChild host moves are safe.
  useEffect(() => {
    const home = videoHomeRef.current;
    if (!home) return;

    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "none";
    video.className = "h-full w-full bg-black object-contain";
    home.appendChild(video);
    videoRef.current = video;

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
      if (videoRef.current === video) videoRef.current = null;
    };
  }, []);

  const hasRestored = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const connectedRef = useRef(false);
  const safariRef = useRef<SafariAudioAnalyser | null>(null);
  const intendedPlayingRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const volumeRef = useRef(1);
  const scheduleReconnectRef = useRef<(() => void) | null>(null);
  const mediaRef = useRef<PlaybackMedia | null>(null);
  mediaRef.current = media;

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const disableCaptions = useCallback((el: HTMLMediaElement) => {
    if (!("textTracks" in el)) return;
    const tracks = el.textTracks;
    const disable = () => {
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = "disabled";
      }
    };
    disable();
    tracks.addEventListener("addtrack", disable);
    // Keep a handle so we can remove on next attach
    (el as HTMLMediaElement & { __ccCleanup?: () => void }).__ccCleanup = () => {
      tracks.removeEventListener("addtrack", disable);
    };
  }, []);

  const placeVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const hosts = videoHostsRef.current;
    const target = hosts.modal || hosts.bar || videoHomeRef.current;
    if (target && video.parentElement !== target) {
      target.appendChild(video);
    }
    // Resume after remount — playback often stalls if it began in a display:none node.
    if (
      intendedPlayingRef.current &&
      mediaRef.current?.kind === "tv" &&
      video.paused
    ) {
      void video.play().catch(() => {
        /* autoplay / transient */
      });
    }
  }, []);

  const registerVideoHost = useCallback(
    (id: VideoHostId, el: HTMLElement | null) => {
      videoHostsRef.current[id] = el;
      placeVideo();
    },
    [placeVideo]
  );

  const stopAudioElement = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    safariRef.current?.stop();
  }, []);

  const stopVideoElement = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  }, []);

  const attachSource = useCallback(
    (
      el: HTMLMediaElement,
      streamUrl: string,
      onPlayFailed: (err: unknown) => void
    ) => {
      const url = streamPlaybackUrl(streamUrl);
      destroyHls();
      safariRef.current?.stop();
      const prevCleanup = (
        el as HTMLMediaElement & { __ccCleanup?: () => void }
      ).__ccCleanup;
      prevCleanup?.();

      if (isHlsUrl(streamUrl)) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            // lowLatencyMode breaks a number of AU live playlists
            lowLatencyMode: false,
            capLevelToPlayerSize: false,
            backBufferLength: 90,
            maxBufferLength: 30,
          });
          hlsRef.current = hls;
          hls.subtitleDisplay = false;
          hls.attachMedia(el);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(url);
          });
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            disableCaptions(el);
            try {
              hls.subtitleTrack = -1;
              hls.subtitleDisplay = false;
            } catch {
              /* noop */
            }
            void el.play().catch(onPlayFailed);
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            console.warn("HLS fatal error", data.type, data.details);
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
              return;
            }
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
              return;
            }
            onPlayFailed(data);
          });
          disableCaptions(el);
          return { mode: "hls" as const, url };
        }
        if (el.canPlayType("application/vnd.apple.mpegurl")) {
          el.src = url;
          disableCaptions(el);
          void el.play().catch(onPlayFailed);
          return { mode: "native-hls" as const, url };
        }
        onPlayFailed(new Error("HLS not supported"));
        return { mode: "unsupported" as const, url };
      }

      el.src = url;
      disableCaptions(el);
      void el.play().catch(onPlayFailed);
      return { mode: "progressive" as const, url };
    },
    [destroyHls, disableCaptions]
  );

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current != null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      return;
    }
    const ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    audioCtxRef.current = ctx;
  }, []);

  const connectChromeAnalyser = useCallback(() => {
    const audio = audioRef.current;
    const ctx = audioCtxRef.current;
    if (!audio || !ctx) return;

    // MediaElementSource can only be created once per element. After TV
    // playback clears analyser state, re-expose the existing node.
    if (connectedRef.current) {
      if (chromeAnalyserRef.current) {
        setAnalyser(chromeAnalyserRef.current);
      }
      void ctx.resume();
      return;
    }

    try {
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      node.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaElementSource(audio);
      source.connect(node);
      node.connect(ctx.destination);
      chromeAnalyserRef.current = node;
      connectedRef.current = true;
      setAnalyser(node);
    } catch (e) {
      console.warn("Web Audio setup failed:", e);
    }
  }, []);

  const pause = useCallback(() => {
    clearReconnectTimer();
    reconnectAttemptRef.current = 0;
    intendedPlayingRef.current = false;
    setIsReconnecting(false);
    destroyHls();
    stopAudioElement();
    stopVideoElement();
    setIsPlaying(false);
    const current = mediaRef.current;
    if (current?.kind === "radio") persistRadio(current.station, false);
    if (current?.kind === "tv") persistTv(current.channel, false);
  }, [clearReconnectTimer, destroyHls, stopAudioElement, stopVideoElement]);

  const play = useCallback(
    (s: Station) => {
      if (!s.streamUrl) {
        setError("Stream URL not available");
        return;
      }
      clearReconnectTimer();
      reconnectAttemptRef.current = 0;
      intendedPlayingRef.current = true;
      setError(null);
      setIsReconnecting(false);

      // Exclusive: stop TV
      destroyHls();
      stopVideoElement();
      persistTv(null, false);

      setMedia({ kind: "radio", station: s });
      persistRadio(s, true);
      sessionStorage.removeItem(TV_STORAGE_KEY);

      const audio = audioRef.current;
      if (audio) {
        ensureAudioContext();
        audio.volume = volumeRef.current;
        audio.muted = volumeRef.current === 0;

        const onPlayFailed = (err: unknown) => {
          console.error("Playback failed:", err);
          if (intendedPlayingRef.current && s.streamUrl) {
            scheduleReconnectRef.current?.();
            return;
          }
          setError("Stream unavailable");
          setIsPlaying(false);
          setIsReconnecting(false);
          persistRadio(s, false);
        };

        const { mode } = attachSource(audio, s.streamUrl, onPlayFailed);

        if (mode === "progressive" && isSafari()) {
          const sa = new SafariAudioAnalyser(audioCtxRef.current!);
          safariRef.current = sa;
          setAnalyser(sa.getAnalyser());
        } else if (!isSafari() && mode !== "unsupported") {
          connectChromeAnalyser();
        } else if (isSafari() && mode !== "unsupported" && chromeAnalyserRef.current) {
          // Native HLS on WebKit may already have a chrome analyser from earlier.
          setAnalyser(chromeAnalyserRef.current);
        }
        void audioCtxRef.current?.resume();
        setIsPlaying(true);
      }
    },
    [
      clearReconnectTimer,
      destroyHls,
      stopVideoElement,
      ensureAudioContext,
      connectChromeAnalyser,
      attachSource,
    ]
  );

  const playChannel = useCallback(
    (c: Channel) => {
      if (!c.streamUrl) {
        setError("Stream URL not available");
        return;
      }
      clearReconnectTimer();
      reconnectAttemptRef.current = 0;
      intendedPlayingRef.current = true;
      setError(null);
      setIsReconnecting(false);

      // Exclusive: stop radio
      destroyHls();
      stopAudioElement();
      setAnalyser(null);
      persistRadio(null, false);
      sessionStorage.removeItem(STORAGE_KEY);

      setMedia({ kind: "tv", channel: c });
      persistTv(c, true);

      // Prefer the visible modal/bar host before attaching MediaSource.
      placeVideo();

      const video = videoRef.current;
      if (!video) {
        setError("Video player unavailable");
        setIsPlaying(false);
        return;
      }

      video.volume = volumeRef.current;
      video.muted = volumeRef.current === 0;

      const onPlayFailed = (err: unknown) => {
        console.error("Video playback failed:", err);
        if (intendedPlayingRef.current && c.streamUrl) {
          scheduleReconnectRef.current?.();
          return;
        }
        setError("Stream unavailable");
        setIsPlaying(false);
        setIsReconnecting(false);
        persistTv(c, false);
      };

      attachSource(video, c.streamUrl, onPlayFailed);
      setIsPlaying(true);

      // One more place+play after layout in case the host registered mid-attach.
      requestAnimationFrame(() => {
        placeVideo();
        if (intendedPlayingRef.current && video.paused) {
          void video.play().catch(onPlayFailed);
        }
      });
    },
    [
      clearReconnectTimer,
      destroyHls,
      stopAudioElement,
      placeVideo,
      attachSource,
    ]
  );

  const setVolume = useCallback((v: number) => {
    const val = Math.max(0, Math.min(1, v));
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const getVideoElement = useCallback(() => videoRef.current, []);

  const requestVideoFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const host = video.parentElement;
    const target = (host && host !== videoHomeRef.current ? host : video) as
      | HTMLElement
      | (HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
        });

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (target.requestFullscreen) {
        await target.requestFullscreen();
        return;
      }
      const webkit = video as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      };
      if (typeof webkit.webkitEnterFullscreen === "function") {
        webkit.webkitEnterFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen failed:", e);
    }
  }, []);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    const savedTv = restoreChannel();
    if (savedTv?.streamUrl) {
      setMedia({ kind: "tv", channel: savedTv });
      setIsPlaying(false);
      return;
    }
    const saved = restoreStation();
    if (!saved?.streamUrl) return;
    setMedia({ kind: "radio", station: saved });
    const audio = audioRef.current;
    if (audio) {
      if (!isHlsUrl(saved.streamUrl)) {
        audio.src = streamPlaybackUrl(saved.streamUrl);
      }
      audio.volume = 1;
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    if (!audio || !video) return;

    const activeEl = () =>
      mediaRef.current?.kind === "tv" ? video : audio;

    const scheduleReconnect = () => {
      if (!intendedPlayingRef.current) return;
      const current = mediaRef.current;
      const streamUrl =
        current?.kind === "radio"
          ? current.station.streamUrl
          : current?.kind === "tv"
            ? current.channel.streamUrl
            : null;
      if (!streamUrl) return;

      clearReconnectTimer();
      const attempt = reconnectAttemptRef.current;
      reconnectAttemptRef.current = attempt + 1;
      const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5));

      setIsReconnecting(true);
      setError(null);

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (!intendedPlayingRef.current || !mediaRef.current) return;

        const el = activeEl();
        if (!el) return;
        const st = mediaRef.current;
        const url =
          st.kind === "radio" ? st.station.streamUrl : st.channel.streamUrl;
        if (!url) return;

        const onPlayFailed = () => {
          if (intendedPlayingRef.current) scheduleReconnect();
        };

        try {
          el.pause();
          el.volume = volumeRef.current;
          attachSource(el, url, onPlayFailed);
        } catch (e) {
          console.warn("Stream reconnect load failed:", e);
          scheduleReconnect();
        }
      }, delay);
    };

    scheduleReconnectRef.current = scheduleReconnect;

    const onError = () => {
      if (!intendedPlayingRef.current) {
        setError("Stream unavailable");
        setIsPlaying(false);
        setIsReconnecting(false);
        const current = mediaRef.current;
        if (current?.kind === "radio") persistRadio(current.station, false);
        if (current?.kind === "tv") persistTv(current.channel, false);
        return;
      }
      scheduleReconnect();
    };

    const onEnded = () => {
      if (intendedPlayingRef.current) scheduleReconnect();
    };

    const onPlay = (e: Event) => {
      const target = e.target as HTMLMediaElement;
      const expectingVideo = mediaRef.current?.kind === "tv";
      if (expectingVideo && target !== video) return;
      if (!expectingVideo && target !== audio) return;

      intendedPlayingRef.current = true;
      reconnectAttemptRef.current = 0;
      setError(null);
      setIsReconnecting(false);
      setIsPlaying(true);
      const current = mediaRef.current;
      if (current?.kind === "radio") persistRadio(current.station, true);
      if (current?.kind === "tv") persistTv(current.channel, true);
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.playbackState = "playing";
        } catch {
          /* noop */
        }
      }
      void audioCtxRef.current?.resume();
      if (
        current?.kind === "radio" &&
        isSafari() &&
        audioCtxRef.current &&
        current.station.streamUrl &&
        !isHlsUrl(current.station.streamUrl)
      ) {
        const url = audio.currentSrc || audio.src;
        if (!url) return;
        if (!safariRef.current) {
          const sa = new SafariAudioAnalyser(audioCtxRef.current);
          safariRef.current = sa;
          setAnalyser(sa.getAnalyser());
        }
        void safariRef.current.start(url);
      }
    };

    const onPause = (e: Event) => {
      const target = e.target as HTMLMediaElement;
      const expectingVideo = mediaRef.current?.kind === "tv";
      if (expectingVideo && target !== video) return;
      if (!expectingVideo && target !== audio) return;

      safariRef.current?.stop();
      setIsPlaying(false);
      if (!intendedPlayingRef.current && mediaRef.current) {
        const current = mediaRef.current;
        if (current.kind === "radio") persistRadio(current.station, false);
        if (current.kind === "tv") persistTv(current.channel, false);
      }
      if ("mediaSession" in navigator) {
        try {
          if (!intendedPlayingRef.current) {
            navigator.mediaSession.playbackState = "paused";
          }
        } catch {
          /* noop */
        }
      }
    };

    for (const el of [audio, video]) {
      el.addEventListener("error", onError);
      el.addEventListener("ended", onEnded);
      el.addEventListener("play", onPlay);
      el.addEventListener("pause", onPause);
    }
    return () => {
      scheduleReconnectRef.current = null;
      clearReconnectTimer();
      destroyHls();
      for (const el of [audio, video]) {
        el.removeEventListener("error", onError);
        el.removeEventListener("ended", onEnded);
        el.removeEventListener("play", onPlay);
        el.removeEventListener("pause", onPause);
      }
    };
  }, [clearReconnectTimer, attachSource, destroyHls]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => {
        const current = mediaRef.current;
        if (!current) return;
        if (current.kind === "tv") {
          void videoRef.current?.play();
        } else {
          void audioRef.current?.play();
        }
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        pause();
      });
    } catch {
      /* unsupported */
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      } catch {
        /* noop */
      }
    };
  }, [pause]);

  useEffect(() => {
    if (!media || typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const artwork =
      origin.length > 0
        ? [
            {
              src: `${origin}/apple-touch-icon.png?v=20260907`,
              sizes: "180x180",
              type: "image/png",
            },
            {
              src: `${origin}/icon-512.png?v=20260907`,
              sizes: "512x512",
              type: "image/png",
            },
          ]
        : [];

    if (media.kind === "radio") {
      const station = media.station;
      const locationLine = [station.city?.trim(), station.state?.trim()]
        .filter(Boolean)
        .join(", ");
      const artist = locationLine || "Australia";
      const cs = station.callsign?.trim() ?? "";
      const nameLow = station.name.toLowerCase();
      const csLow = cs.toLowerCase();
      const album =
        cs &&
        cs.length <= 48 &&
        !nameLow.includes(csLow.slice(0, Math.min(csLow.length, 16)))
          ? cs
          : "Live stream";
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: station.name,
          artist,
          album,
          artwork,
        });
      } catch {
        /* ignore */
      }
      return;
    }

    const channel = media.channel;
    const artist =
      [channel.network, channel.state].filter(Boolean).join(" · ") ||
      "Australian TV";
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: channel.name,
        artist,
        album: "Live TV",
        artwork,
      });
    } catch {
      /* ignore */
    }
  }, [media]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const station = media?.kind === "radio" ? media.station : null;

  return (
    <PlayerContext.Provider
      value={{
        station,
        media,
        isPlaying,
        volume,
        error,
        isReconnecting,
        analyser,
        play,
        playChannel,
        pause,
        setVolume,
        clearError,
        registerVideoHost,
        setVideoModalOpen,
        videoModalOpen,
        requestVideoFullscreen,
        getVideoElement,
      }}
    >
      {children}
      <audio ref={audioRef} preload="none" aria-hidden className="hidden" />
      {/* Parking slot only — video node is created imperatively (see mount effect). */}
      <div
        ref={videoHomeRef}
        aria-hidden
        style={{
          position: "fixed",
          left: "-100vw",
          top: 0,
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
