"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared filter chrome.
 * DESIGN.md: inputs are 6px radius, rgba(255,255,255,0.02) fill,
 * 1px rgba(255,255,255,0.08) border, Mist text. Pills are 9999px,
 * rgba(255,255,255,0.05) when idle. The selected state uses the
 * neutral paper pill (not acid lime — that accent is only the play CTA).
 * Phone controls are 44px tall so they stay tappable; type stays 13px
 * except the search/select field, which is 16px on phones so iOS
 * does not zoom the page on focus.
 */

const CHEVRON =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' stroke='%23d0d6e0' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

export const filterSelectClass = cn(
  "h-11 w-full min-w-0 appearance-none rounded-inputs border border-white/[0.08] bg-white/[0.02] bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat px-3.5 pr-9 text-base font-normal text-mist outline-none transition-colors [color-scheme:dark] focus:border-mist sm:h-auto sm:w-auto sm:py-2.5 sm:text-[13px]"
);

export const filterSelectStyle = {
  backgroundImage: CHEVRON,
} as const;

export function FilterPill({
  pressed,
  onPressedChange,
  children,
}: {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex h-11 items-center rounded-full px-3 text-[13px] font-normal tracking-tight [-webkit-tap-highlight-color:transparent] sm:h-9",
        pressed ? "bg-paper font-medium text-void" : "bg-white/[0.05] text-mist"
      )}
    >
      {children}
    </button>
  );
}
