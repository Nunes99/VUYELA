import type { Metadata } from "next";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { OfflineCardList } from "@/features/pwa/offline-card-list";

export const metadata: Metadata = {
  title: "Cartões offline",
  robots: {
    index: false,
    follow: false
  }
};

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <div className="offline-shell">
        <header className="offline-header">
          <VuyelaLogo />
          <div>
            <h1>Cartões disponíveis offline</h1>
          </div>
        </header>
        <OfflineCardList />
      </div>
    </main>
  );
}
