"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}
const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000;
const getServerSnapshot = () => null;

/** Local time (ms), ticking every second. null during server rendering and hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
