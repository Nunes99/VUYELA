"use client";

import { LocateFixed } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LocationSearchButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "blocked">("idle");

  function requestLocation() {
    if (!navigator.geolocation) {
      setStatus("blocked");
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("lat", position.coords.latitude.toFixed(5));
        nextParams.set("lng", position.coords.longitude.toFixed(5));
        router.push(`/pesquisar?${nextParams.toString()}`);
      },
      () => {
        setStatus("blocked");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 8_000
      }
    );
  }

  return (
    <div className="marketplace-location-control">
      <button
        className="marketplace-button marketplace-button--ghost"
        disabled={status === "loading"}
        onClick={requestLocation}
        type="button"
      >
        <LocateFixed size={17} />
        {status === "loading" ? "A localizar" : "Perto de mim"}
      </button>
      {status === "blocked" ? <small>Localização indisponível.</small> : null}
    </div>
  );
}
