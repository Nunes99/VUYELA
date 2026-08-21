"use client";

import { useEffect } from "react";

const shouldRegister =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_PWA_TEST === "true";

export function PwaRegistration() {
  useEffect(() => {
    if (!shouldRegister || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    async function register() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none"
        });

        if (!cancelled) {
          await registration.update();
        }
      } catch {
        // The application remains fully usable online when service workers are unavailable.
      }
    }

    void register();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
