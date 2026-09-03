import Image from "next/image";

export function ProfileAvatar({
  className,
  displayName,
  src,
  decorative = true
}: {
  className: string;
  displayName: string;
  src?: string | null | undefined;
  decorative?: boolean;
}) {
  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={!decorative ? `${src ? "Fotografia" : "Perfil"} de ${displayName}` : undefined}
      className={`${className} profile-avatar${src ? " profile-avatar--image" : ""}`}
      role={!decorative ? "img" : undefined}
    >
      {src ? (
        <Image alt="" fill sizes="96px" src={src} unoptimized />
      ) : (
        initials(displayName)
      )}
    </span>
  );
}

function initials(value: string): string {
  const parts = value.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "V"}${parts[1]?.[0] ?? parts[0]?.[1] ?? "Y"}`.toUpperCase();
}
