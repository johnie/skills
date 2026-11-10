"use client";

import { useEffect } from "react";

import { FLIGHT_HEADER, FLIGHT_HEADER_VALUE } from "@/lib/flight";

/** The `max-age` rshono serves prerendered pages with: past it, a warmed payload no longer answers the click. */
const FRESH_MS = 300_000;

/**
 * The URL a hovered or focused link soft-navigates to, or `undefined` for a link rshono leaves to the browser
 * (off-site, `data-native`, a file) or one that stays on the current page.
 */
const destination = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return;
  }

  const link = target.closest("a[href]");

  if (
    !(link instanceof HTMLAnchorElement) ||
    Object.hasOwn(link.dataset, "native") ||
    link.hasAttribute("download") ||
    (link.target !== "" && link.target !== "_self")
  ) {
    return;
  }

  const url = new URL(link.href);

  if (
    url.origin !== location.origin ||
    (url.pathname.split("/").pop() ?? "").includes(".") ||
    (url.pathname === location.pathname && url.search === location.search)
  ) {
    return;
  }

  url.hash = "";

  return url.href;
};

/**
 * Fetches a link's flight payload when it is hovered or focused, so the click finds it in the browser's HTTP
 * cache. rshono's own navigation fetch sends the same request with the default cache mode, and prerendered
 * payloads are `public, max-age=300`, so the cached copy is what answers it.
 */
export const LinkPrefetch = () => {
  useEffect(() => {
    const warmed = new Map<string, number>();

    const warm = async (event: Event) => {
      const href = destination(event.target);

      if (href === undefined) {
        return;
      }

      const at = warmed.get(href);

      if (at !== undefined && Date.now() - at < FRESH_MS) {
        return;
      }

      warmed.set(href, Date.now());

      try {
        const response = await fetch(href, {
          headers: { [FLIGHT_HEADER]: FLIGHT_HEADER_VALUE },
        });

        // The cache entry is complete only once the whole body has been read.
        await response.arrayBuffer();

        if (!response.ok) {
          warmed.delete(href);
        }
      } catch {
        // Best effort: the click fetches the payload itself and surfaces any failure there.
        warmed.delete(href);
      }
    };

    document.addEventListener("pointerover", warm, { passive: true });
    document.addEventListener("focusin", warm);

    return () => {
      document.removeEventListener("pointerover", warm);
      document.removeEventListener("focusin", warm);
    };
  }, []);

  return null;
};
