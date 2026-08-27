"use client";

import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { pwaApplications } from "@/features/pwa/apps";
import type { PwaArea } from "@/features/pwa/apps";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export function PwaInstallAction({ area }: { area: PwaArea }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const application = pwaApplications[area];

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as NavigatorWithStandalone).standalone);
    setInstalled(isStandalone);

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstalled(choice.outcome === "accepted");
  }

  if (installed) {
    return null;
  }

  return (
    <div className="pwa-install-action">
      <button onClick={install} type="button">
        <Download aria-hidden="true" size={18} />
        <span>Instalar aplicação</span>
      </button>
      {showInstructions
        ? createPortal(
            <div
              className="pwa-install-dialog-backdrop"
              onClick={() => setShowInstructions(false)}
              role="presentation"
            >
              <section
                aria-labelledby={`pwa-install-title-${area}`}
                aria-modal="true"
                className="pwa-install-dialog"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
              >
                <button
                  aria-label="Fechar instruções de instalação"
                  className="pwa-install-dialog__close"
                  onClick={() => setShowInstructions(false)}
                  type="button"
                >
                  <X aria-hidden="true" size={20} />
                </button>
                <Share2 aria-hidden="true" className="pwa-install-dialog__icon" size={28} />
                <span>
                  Aplicação{" "}
                  {area === "negocio"
                    ? "do negócio"
                    : area === "admin"
                      ? "de administração"
                      : "do cliente"}
                </span>
                <h2 id={`pwa-install-title-${area}`}>{application.shortName}</h2>
                <p>
                  No iPhone ou iPad, abra <strong>Partilhar</strong> e escolha
                  <strong> Adicionar ao ecrã principal</strong>. Nos restantes navegadores, escolha
                  <strong> Instalar aplicação</strong> no menu.
                </p>
                <button
                  className="pwa-install-dialog__confirm"
                  onClick={() => setShowInstructions(false)}
                  type="button"
                >
                  Entendi
                </button>
              </section>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
