"use client";

import { useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { Locale, copy } from "@/lib/site";

type ShareButtonsProps = {
  locale: Locale;
  url: string;
  title: string;
  contentType: "article" | "project" | "news";
  slug: string;
};

function buildLinkedInShareUrl(url: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

function buildXShareUrl(url: string, title: string) {
  const params = new URLSearchParams({
    text: title,
    url,
  });
  return `https://x.com/intent/tweet?${params.toString()}`;
}

export function ShareButtons({
  locale,
  url,
  title,
  contentType,
  slug,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  function emitShare(channel: "linkedin" | "x" | "copy") {
    trackEvent("share_click", {
      channel,
      locale,
      content_type: contentType,
      slug,
      location: "detail_share",
    });
  }

  async function handleCopy() {
    emitShare("copy");

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const linkClassName =
    "text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-[var(--accent-mint)]";

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
        {copy(locale, "Share", "Compartilhar")}
      </span>
      <a
        href={buildLinkedInShareUrl(url)}
        target="_blank"
        rel="noreferrer"
        className={linkClassName}
        onClick={() => emitShare("linkedin")}
      >
        LinkedIn
      </a>
      <a
        href={buildXShareUrl(url, title)}
        target="_blank"
        rel="noreferrer"
        className={linkClassName}
        onClick={() => emitShare("x")}
      >
        X
      </a>
      <button type="button" className={linkClassName} onClick={handleCopy}>
        {copied
          ? copy(locale, "Copied", "Copiado")
          : copy(locale, "Copy link", "Copiar link")}
      </button>
    </div>
  );
}
