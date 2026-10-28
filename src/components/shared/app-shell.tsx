"use client";

import * as React from "react";
import { BottomNav } from "./bottom-nav";
import { AdContainer } from "./ad-container";
import { InterstitialAd } from "./interstitial-ad";
import { PopunderLoader } from "./popunder-loader";
import { PlayerAdTrigger } from "./player-ad-trigger";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";

// Views that should show the bottom navigation bar.
const WITH_NAV = new Set(["home", "channels", "matches", "favorites", "more"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const view = useNav((s) => s.view);
  const loadFav = useFavorites((s) => s.load);

  React.useEffect(() => {
    loadFav();
  }, [loadFav]);

  const showNav = WITH_NAV.has(view.name);

  return (
    <div className="bg-app flex min-h-screen flex-col">
      {/* إعلانات الانتقال بين الصفحات (HilltopAds Interstitial) */}
      <InterstitialAd />
      {/* Popunder — يُحمّل مرة واحدة ويعمل عند أي نقطة في الموقع (invisible) */}
      <PopunderLoader />
      {/* إعلان المشغل — يفتح بعد 8 ثوانٍ من مشاهدة قناة (مكان آخر) */}
      <PlayerAdTrigger />

      <main className={showNav ? "mx-auto w-full max-w-3xl flex-1 pb-40" : "mx-auto w-full max-w-3xl flex-1"}>
        {children}
      </main>
      {showNav && (
        <>
          {/* إعلان لاصق أسفل الشاشة (HilltopAds Sticky) */}
          <AdContainer slot="sticky_bottom" variant="sticky" />
          <BottomNav />
        </>
      )}
    </div>
  );
}
