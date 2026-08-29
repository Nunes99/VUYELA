"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isInternalNavigation(event: MouseEvent): boolean {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const target = event.target;
  const anchor = target instanceof Element ? target.closest("a[href]") : null;
  if (!(anchor instanceof HTMLAnchorElement) || anchor.target || anchor.hasAttribute("download")) {
    return false;
  }

  const destination = new URL(anchor.href, window.location.href);
  const current = new URL(window.location.href);

  return (
    destination.origin === current.origin &&
    `${destination.pathname}${destination.search}` !== `${current.pathname}${current.search}`
  );
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setPending(false);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [routeKey]);

  useEffect(() => {
    const start = (event: MouseEvent) => {
      if (!isInternalNavigation(event)) {
        return;
      }

      setPending(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setPending(false), 15_000);
    };

    document.addEventListener("click", start, true);
    return () => {
      document.removeEventListener("click", start, true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`navigation-progress${pending ? " is-active" : ""}`}
    >
      <span />
    </div>
  );
}
