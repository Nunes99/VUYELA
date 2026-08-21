import type { Metadata } from "next";
import Image from "next/image";

import { OfflineCardList } from "@/features/pwa/offline-card-list";

export const metadata: Metadata = {
  title: "Cartoes offline",
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
          <Image
            alt=""
            aria-hidden="true"
            height={52}
            priority
            src="/icons/vuyela-192.png"
            unoptimized
            width={52}
          />
          <div>
            <span>VUYELA by LEMOTE</span>
            <h1>Cartoes disponiveis offline</h1>
          </div>
        </header>
        <OfflineCardList />
      </div>
    </main>
  );
}
