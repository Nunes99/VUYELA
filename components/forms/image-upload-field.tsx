"use client";

import { ImageIcon, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { businessMediaAccept, businessMediaMaxBytes } from "@/lib/business-media-config";

export function ImageUploadField({
  name,
  label,
  currentUrl,
  removeName,
  shape = "landscape",
  hint = "JPEG, PNG ou WebP. Máximo 5 MB."
}: {
  name: string;
  label: string;
  currentUrl?: string | null | undefined;
  removeName: string;
  shape?: "landscape" | "square" | "avatar";
  hint?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewUrl = objectUrl ?? (!removed ? currentUrl : null);

  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl]
  );

  return (
    <div className={`business-image-field business-image-field--${shape}`}>
      <div className="business-image-field__preview">
        {previewUrl ? (
          <Image
            alt=""
            fill
            sizes={shape === "landscape" ? "420px" : "160px"}
            src={previewUrl}
            unoptimized
          />
        ) : (
          <span>
            <ImageIcon aria-hidden="true" size={26} />
            Sem imagem
          </span>
        )}
      </div>
      <div className="business-image-field__controls">
        <strong>{label}</strong>
        <small>{hint}</small>
        {error ? (
          <small className="business-image-field__error" role="alert">
            {error}
          </small>
        ) : null}
        <div>
          <label htmlFor={inputId}>
            <UploadCloud aria-hidden="true" size={17} />
            {previewUrl ? "Substituir" : "Carregar imagem"}
          </label>
          {previewUrl ? (
            <button
              onClick={() => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                if (inputRef.current) inputRef.current.value = "";
                setObjectUrl(null);
                setRemoved(true);
                setError(null);
              }}
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} /> Remover
            </button>
          ) : null}
        </div>
      </div>
      <input
        accept={businessMediaAccept}
        className="sr-only"
        id={inputId}
        name={name}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          if (
            !businessMediaAccept.split(",").includes(file.type) ||
            file.size > businessMediaMaxBytes
          ) {
            event.currentTarget.value = "";
            setError("Use uma imagem JPEG, PNG ou WebP com no máximo 5 MB.");
            return;
          }
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          setObjectUrl(URL.createObjectURL(file));
          setRemoved(false);
          setError(null);
        }}
        ref={inputRef}
        type="file"
      />
      <input name={removeName} type="hidden" value={removed ? "on" : ""} />
    </div>
  );
}
