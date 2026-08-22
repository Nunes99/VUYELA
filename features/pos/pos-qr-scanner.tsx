"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, CheckCircle2 } from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";

interface PosQrScannerProps {
  onDetected: (value: string) => void;
}

type ScannerStatus = "idle" | "starting" | "scanning" | "detected" | "error";

export function PosQrScanner({ onDetected }: PosQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState("Ative a câmara e enquadre o QR do cartão.");

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setStatus((current) => (current === "detected" ? current : "idle"));
  }, []);

  useEffect(() => stopScanner, [stopScanner]);

  const startScanner = useCallback(async () => {
    if (!videoRef.current || status === "starting" || status === "scanning") {
      return;
    }

    setStatus("starting");
    setMessage("A preparar a câmara...");

    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 250,
        delayBetweenScanSuccess: 800
      });
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        videoRef.current,
        (result) => {
          if (!result) {
            return;
          }

          const value = result.getText().trim();
          if (!value) {
            return;
          }

          controlsRef.current?.stop();
          controlsRef.current = null;
          setStatus("detected");
          setMessage("QR lido. Confirme para identificar o cliente.");
          onDetected(value);
        }
      );

      controlsRef.current = controls;
      setStatus("scanning");
      setMessage("Câmara ativa. Mantenha o QR dentro da moldura.");
    } catch {
      setStatus("error");
      setMessage(
        "Não foi possível usar a câmara. Autorize o acesso ou introduza o código manualmente."
      );
    }
  }, [onDetected, status]);

  const isActive = status === "starting" || status === "scanning";

  return (
    <div className={`pos-qr-scanner pos-qr-scanner--${status}`}>
      <div className="pos-qr-scanner__viewport">
        <video
          aria-label="Pré-visualização da câmara para leitura QR"
          muted
          playsInline
          ref={videoRef}
        />
        <span aria-hidden="true" className="pos-qr-scanner__frame" />
        {status === "detected" ? <CheckCircle2 aria-hidden="true" size={34} /> : null}
      </div>
      <div className="pos-qr-scanner__controls">
        <p role={status === "error" ? "alert" : "status"}>{message}</p>
        {isActive ? (
          <Button
            leadingIcon={<CameraOff aria-hidden="true" size={18} />}
            onClick={stopScanner}
            type="button"
            variant="outline"
          >
            Desativar câmara
          </Button>
        ) : (
          <Button
            leadingIcon={<Camera aria-hidden="true" size={18} />}
            onClick={startScanner}
            type="button"
            variant="secondary"
          >
            Ativar câmara
          </Button>
        )}
      </div>
    </div>
  );
}
