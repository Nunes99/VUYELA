"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export function ApplicationError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="application-error" role="alert">
      <div className="application-error__panel">
        <span className="application-error__icon" aria-hidden="true">
          <AlertTriangle />
        </span>
        <span className="application-error__eyebrow">Não foi possível concluir o carregamento</span>
        <h1>Esta área está temporariamente indisponível.</h1>
        <p>
          Os seus dados não foram alterados. Tente novamente ou volte ao início para continuar a
          utilizar a VUYELA.
        </p>
        <div className="application-error__actions">
          <button onClick={reset} type="button">
            <RotateCcw aria-hidden="true" size={18} /> Tentar novamente
          </button>
          <Link href="/">
            <Home aria-hidden="true" size={18} /> Página inicial
          </Link>
        </div>
        {error.digest ? <small>Referência: {error.digest}</small> : null}
      </div>
    </main>
  );
}
