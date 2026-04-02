"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { trackEvent } from "@/lib/analytics";
import { resolveAnalyticsContext } from "@/lib/analytics-context";

export function RouteEngagementTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const { locale, pageType, section } = resolveAnalyticsContext(pathname);

    trackEvent("content_view", {
      page: pathname,
      locale,
      page_type: pageType,
      section,
    });
  }, [pathname]);

  return null;
}
