"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

export type LogoPlate = "light" | "dark";
export type MediaLogoKind = "radio" | "tv";

export interface MediaLogoProps {
  url: string | null | undefined;
  kind?: MediaLogoKind;
  /** Force plate; otherwise detected from logo luminance when CORS allows */
  plate?: LogoPlate | null;
  className?: string;
  iconClassName?: string;
  size?: number;
}

const plateCache = new Map<string, LogoPlate>();

function defaultPlateFor(kind: MediaLogoKind): LogoPlate {
  return kind === "tv" ? "dark" : "light";
}

function detectPlate(img: HTMLImageElement): LogoPlate | null {
  const w = Math.min(64, img.naturalWidth || 0);
  const h = Math.min(64, img.naturalHeight || 0);
  if (w < 2 || h < 2) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }

  let sum = 0;
  let count = 0;
  const { data: px } = data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a < 24) continue;
    sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    count++;
  }
  if (count < 8) return null;
  return sum / count >= 148 ? "dark" : "light";
}

export function MediaLogo({
  url,
  kind = "radio",
  plate: plateProp = null,
  className,
  iconClassName,
  size = 48,
}: MediaLogoProps) {
  const fallback = defaultPlateFor(kind);
  const cached = url ? plateCache.get(url) : undefined;
  const [failed, setFailed] = useState(false);
  const [plate, setPlate] = useState<LogoPlate>(
    plateProp ?? cached ?? fallback
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (plateProp) {
      setPlate(plateProp);
      return;
    }

    const kindDefault = defaultPlateFor(kind);
    if (!url) {
      setPlate(kindDefault);
      return;
    }

    const hit = plateCache.get(url);
    if (hit) {
      setPlate(hit);
      return;
    }

    setPlate(kindDefault);

    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    let cancelled = false;
    let idleId: number | null = null;
    let observer: IntersectionObserver | null = null;

    const runDetect = () => {
      const img = new Image();
      img.decoding = "async";
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        const detected = detectPlate(img) ?? kindDefault;
        plateCache.set(url, detected);
        setPlate(detected);
      };
      img.onerror = () => {
        if (cancelled) return;
        plateCache.set(url, kindDefault);
      };
      img.src = url;
    };

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer?.disconnect();
        observer = null;
        const ric = (
          window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
          }
        ).requestIdleCallback;
        if (ric) {
          idleId = ric(runDetect, { timeout: 1200 });
        } else {
          idleId = window.setTimeout(runDetect, 50) as unknown as number;
        }
      },
      { rootMargin: "80px", threshold: 0.01 }
    );
    observer.observe(root);

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (idleId != null) {
        const cic = (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback;
        if (cic) cic(idleId);
        else clearTimeout(idleId);
      }
    };
  }, [url, plateProp, kind]);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const showImage = Boolean(url) && !failed;
  const FallbackIcon = kind === "tv" ? Tv : Radio;

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md p-1 ring-1 ring-inset transition-colors",
        plate === "light"
          ? "bg-paper ring-black/10"
          : "bg-void ring-white/[0.08]",
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url!}
          alt=""
          width={size}
          height={size}
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <FallbackIcon
          className={cn(
            plate === "light" ? "text-ash" : "text-fog",
            iconClassName ?? "h-5 w-5"
          )}
        />
      )}
    </div>
  );
}
