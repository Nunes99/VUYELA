import { VuyelaLogo } from "@/components/brand/vuyela-logo";

export default function Loading() {
  return (
    <main className="route-loading" aria-busy="true" aria-live="polite">
      <div className="route-loading__brand">
        <VuyelaLogo />
        <span>A carregar a área solicitada...</span>
      </div>
      <div className="route-loading__layout" aria-hidden="true">
        <span className="route-loading__sidebar" />
        <div>
          <span className="route-loading__line route-loading__line--title" />
          <span className="route-loading__line" />
          <span className="route-loading__panel" />
          <span className="route-loading__panel" />
        </div>
      </div>
    </main>
  );
}
