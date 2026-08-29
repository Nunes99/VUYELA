"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

interface PendingSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  pendingLabel?: ReactNode;
  leadingIcon?: ReactNode;
}

export function PendingSubmitButton({
  children,
  pendingLabel = "A guardar...",
  leadingIcon,
  className = "",
  disabled,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      aria-busy={pending || undefined}
      className={className}
      disabled={disabled || pending}
    >
      {pending ? <span aria-hidden="true" className="form-submit-spinner" /> : leadingIcon}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
