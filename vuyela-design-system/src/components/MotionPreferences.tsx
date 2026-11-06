"use client";

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";

type Preference = "system" | "reduce";
const storageKey = "vuyela-visual-preferences-v1";

interface VisualPreferences {
  motion: Preference;
  transparency: Preference;
  ready: boolean;
  update: (motion: Preference, transparency: Preference) => void;
}

const VisualPreferencesContext = createContext<VisualPreferences | null>(null);

function usePreferenceState(): VisualPreferences {
  const [motion, setMotion] = useState<Preference>("system");
  const [transparency, setTransparency] = useState<Preference>("system");
  const [ready, setReady] = useState(false);

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
    setReady(true);
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
    if (!ready) return;
    document.documentElement.dataset.vyMotion = motion;
    document.documentElement.dataset.vyTransparency = transparency;
  }, [motion, transparency, ready]);

  return { motion, transparency, ready, update };
}

/** Children can remain Server Components; only visual preference state lives here. */
export function VisualPreferencesProvider({ children }: { children: ReactNode }) {
  const preferences = usePreferenceState();
  return (
    <VisualPreferencesContext.Provider value={preferences}>
      {children}
    </VisualPreferencesContext.Provider>
  );
}

/** Stop optional JavaScript motion until preferences are known, and react to OS changes. */
export function useReducedVisualMotion(): boolean {
  const preferences = useContext(VisualPreferencesContext);
  const [systemReduced, setSystemReduced] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  return systemReduced || preferences?.motion === "reduce" || preferences?.ready === false;
}

function PreferenceControls({ motion, transparency, update }: VisualPreferences) {
  const id = useId();

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

function StandalonePreferences() {
  const preferences = usePreferenceState();
  return <PreferenceControls {...preferences} />;
}

export function MotionPreferences() {
  const preferences = useContext(VisualPreferencesContext);
  return preferences ? <PreferenceControls {...preferences} /> : <StandalonePreferences />;
}
