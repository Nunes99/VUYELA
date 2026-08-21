import Image from "next/image";
import Link from "next/link";

interface VuyelaLogoProps {
  className?: string;
  href?: string;
  inverse?: boolean;
  compact?: boolean;
}

export function VuyelaLogo({
  className = "",
  href = "/",
  inverse = false,
  compact = false
}: VuyelaLogoProps) {
  const content = (
    <>
      <Image alt="" aria-hidden="true" height={44} src="/brand/logo-mark.svg" width={44} />
      {!compact ? (
        <span className="vuyela-logo__wordmark">
          <strong>VUYELA</strong>
          <small>by LEMOTE</small>
        </span>
      ) : null}
    </>
  );
  const classes = `vuyela-logo${inverse ? " vuyela-logo--inverse" : ""}${
    compact ? " vuyela-logo--compact" : ""
  }${className ? ` ${className}` : ""}`;

  return (
    <Link aria-label="VUYELA by LEMOTE" className={classes} href={href}>
      {content}
    </Link>
  );
}
