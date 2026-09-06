"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const IS_DESKTOP = process.env.NEXT_PUBLIC_DESKTOP === "1";

export function PWARegister() {
  useEffect(() => {
    if (IS_DESKTOP) return;
    if (
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      const swUrl = BASE ? `${BASE}/sw.js` : "/sw.js";
      navigator.serviceWorker.register(swUrl).catch(() => {});
    }
  }, []);

  return null;
}
