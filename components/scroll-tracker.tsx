"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { trackEvent } from "@/lib/analytics";
import { resolveAnalyticsContext } from "@/lib/analytics-context";

const DEPTH_THRESHOLDS = [25, 50, 75, 100] as const;

export function ScrollTracker() {
  const firedRef = useRef<Set<number>>(new Set());
  const pathname = usePathname();

  useEffect(() => {
    const fired = firedRef.current;
    const context = resolveAnalyticsContext(pathname);

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
            page: pathname,
            locale: context.locale,
            page_type: context.pageType,
          });
        }
      }
    }

    fired.clear();
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return null;
}
