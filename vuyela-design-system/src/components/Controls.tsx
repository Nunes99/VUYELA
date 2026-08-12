import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type ControlTone = "default" | "error";

type ControlBaseProps = {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  icon?: ReactNode;
};

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type">, ControlBaseProps {}

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type">, ControlBaseProps {}

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role">, ControlBaseProps {}

function descriptionId(id: string, hint?: string, error?: string) {
  return (
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined
  );
}

function ControlText({
  id,
  label,
  hint,
  error,
  icon
}: ControlBaseProps & { id: string; tone: ControlTone }) {
  return (
    <span className="vy-control__content">
      <span className="vy-control__label">
        {icon ? <span className="vy-control__icon">{icon}</span> : null}
        {label}
      </span>
      {hint ? (
        <span id={`${id}-hint`} className="vy-control__hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="vy-control__error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, error, icon, id: providedId, className = "", ...props },
  ref
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const tone: ControlTone = error ? "error" : "default";

  return (
    <label className={["vy-control", className].filter(Boolean).join(" ")} htmlFor={id}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="vy-control__input"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={descriptionId(id, hint, error)}
        {...props}
      />
      <span className="vy-control__box" aria-hidden="true" />
      <ControlText id={id} label={label} hint={hint} error={error} icon={icon} tone={tone} />
    </label>
  );
});

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, hint, error, icon, id: providedId, className = "", ...props },
  ref
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const tone: ControlTone = error ? "error" : "default";

  return (
    <label
      className={["vy-control vy-control--radio", className].filter(Boolean).join(" ")}
      htmlFor={id}
    >
      <input
        ref={ref}
        id={id}
        type="radio"
        className="vy-control__input"
        aria-describedby={descriptionId(id, hint, error)}
        {...props}
      />
      <span className="vy-control__box" aria-hidden="true" />
      <ControlText id={id} label={label} hint={hint} error={error} icon={icon} tone={tone} />
    </label>
  );
});

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, hint, error, icon, id: providedId, className = "", ...props },
  ref
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const tone: ControlTone = error ? "error" : "default";

  return (
    <label
      className={["vy-control vy-control--switch", className].filter(Boolean).join(" ")}
      htmlFor={id}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        role="switch"
        className="vy-control__input"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={descriptionId(id, hint, error)}
        {...props}
      />
      <span className="vy-control__switch" aria-hidden="true" />
      <ControlText id={id} label={label} hint={hint} error={error} icon={icon} tone={tone} />
    </label>
  );
});
