"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** Client-only gate without setState-in-effect (React 19 lint). */
export function useClientReady(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/** Keep a ref aligned with the latest value — updates in an effect, not during render. */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
