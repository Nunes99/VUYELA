import { forwardRef, useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

type SharedFieldProps = {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  requiredMark?: boolean | undefined;
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, SharedFieldProps {}
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, SharedFieldProps {}
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, SharedFieldProps {}

function FieldShell({
  id,
  label,
  hint,
  error,
  requiredMark,
  children
}: SharedFieldProps & { id: string; children: ReactNode }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="vy-field">
      <label className="vy-field__label" htmlFor={id}>
        {label}
        {requiredMark ? <span className="vy-field__required"> *</span> : null}
      </label>
      {children}
      {hint ? (
        <span id={hintId} className="vy-field__hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="vy-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, requiredMark, id: providedId, className = "", ...props },
  ref
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy =
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} requiredMark={requiredMark}>
      <input
        ref={ref}
        id={id}
        className={["vy-field__control", className].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        {...props}
      />
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, requiredMark, id: providedId, className = "", ...props },
  ref
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy =
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} requiredMark={requiredMark}>
      <textarea
        ref={ref}
        id={id}
        className={["vy-field__control", className].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, requiredMark, id: providedId, className = "", children, ...props },
  ref
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy =
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} requiredMark={requiredMark}>
      <select
        ref={ref}
        id={id}
        className={["vy-field__control", className].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});
