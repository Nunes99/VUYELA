"use client";

import { ApplicationError } from "@/components/system/application-error";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-MZ">
      <body>
        <ApplicationError error={error} reset={reset} />
      </body>
    </html>
  );
}
