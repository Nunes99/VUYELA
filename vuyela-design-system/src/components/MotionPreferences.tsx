"use client";

import { useEffect, useId, useState } from "react";

type Preference = "system" | "reduce";
const storageKey = "vuyela-visual-preferences-v1";

export function MotionPreferences() {
  const id = useId();
  const [motion, setMotion] = useState<Preference>("system");
  const [transparency, setTransparency] = useState<Preference>("system");

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && typeof saved === "object") {
        if ("motion" in saved && saved.motion === "reduce") setMotion("reduce");
        if ("transparency" in saved && saved.transparency === "reduce") setTransparency("reduce");
      }
    } catch {
      /* Storage is optional, including in private browsing. */
    }
  }, []);

  function update(nextMotion: Preference, nextTransparency: Preference) {
    setMotion(nextMotion);
    setTransparency(nextTransparency);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ motion: nextMotion, transparency: nextTransparency })
      );
    } catch {
      /* Keep the current-session preference if persistence is unavailable. */
    }
  }

  useEffect(() => {
    document.documentElement.dataset.vyMotion = motion;
    document.documentElement.dataset.vyTransparency = transparency;
  }, [motion, transparency]);

  return (
    <fieldset className="vy-visual-preferences">
      <legend>Conforto visual</legend>
      <label htmlFor={`${id}-motion`}>
        Movimento
        <select
          id={`${id}-motion`}
          value={motion}
          onChange={(event) =>
            update(event.target.value === "reduce" ? "reduce" : "system", transparency)
          }
        >
          <option value="system">Seguir o dispositivo</option>
          <option value="reduce">Reduzir movimento</option>
        </select>
      </label>
      <label htmlFor={`${id}-transparency`}>
        Transparência
        <select
          id={`${id}-transparency`}
          value={transparency}
          onChange={(event) =>
            update(motion, event.target.value === "reduce" ? "reduce" : "system")
          }
        >
          <option value="system">Seguir o dispositivo</option>
          <option value="reduce">Usar superfícies sólidas</option>
        </select>
      </label>
    </fieldset>
  );
}
