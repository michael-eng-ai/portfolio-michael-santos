"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

const DEPTH_THRESHOLDS = [25, 50, 75, 100] as const;

export function ScrollTracker() {
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const fired = firedRef.current;

    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const threshold of DEPTH_THRESHOLDS) {
        if (percent >= threshold && !fired.has(threshold)) {
          fired.add(threshold);
          trackEvent("scroll_depth", {
            depth: threshold,
            page: window.location.pathname,
          });
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
