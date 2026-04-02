"use client";

import { type ReactNode, useEffect, useMemo, useRef } from "react";

import { trackEvent } from "@/lib/analytics";

type EventValue = string | number | boolean | null | undefined;

type TrackedSurfaceProps = {
  as?: "section" | "div";
  className?: string;
  eventName?: string;
  eventParams?: Record<string, EventValue>;
  children: ReactNode;
};

export function TrackedSurface({
  as = "section",
  className,
  eventName = "surface_view",
  eventParams = {},
  children,
}: TrackedSurfaceProps) {
  const ref = useRef<HTMLElement | null>(null);
  const hasTrackedRef = useRef(false);
  const paramsJson = useMemo(() => JSON.stringify(eventParams), [eventParams]);

  useEffect(() => {
    const node = ref.current;

    if (!node || hasTrackedRef.current) {
      return;
    }

    const payload = JSON.parse(paramsJson) as Record<string, EventValue>;

    const trackSurfaceView = () => {
      if (hasTrackedRef.current) {
        return;
      }

      hasTrackedRef.current = true;
      trackEvent(eventName, payload);
    };

    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      trackSurfaceView();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting && entry.intersectionRatio >= 0.35) {
          trackSurfaceView();
          observer.disconnect();
        }
      },
      {
        threshold: [0.35],
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [eventName, paramsJson]);

  if (as === "div") {
    return (
      <div ref={ref as never} className={className}>
        {children}
      </div>
    );
  }

  return (
    <section ref={ref as never} className={className}>
      {children}
    </section>
  );
}
