"use client";

import { ApplicationError } from "@/components/system/application-error";

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ApplicationError error={error} reset={reset} />;
}
