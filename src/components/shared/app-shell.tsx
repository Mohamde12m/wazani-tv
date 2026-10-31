"use client";

import * as React from "react";
import { BottomNav } from "./bottom-nav";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";

// Views that should show the bottom navigation bar.
const WITH_NAV = new Set(["home", "channels", "matches", "movies", "more"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const view = useNav((s) => s.view);
  const loadFav = useFavorites((s) => s.load);

  React.useEffect(() => {
    loadFav();
  }, [loadFav]);

  const showNav = WITH_NAV.has(view.name);

  return (
    <div className="bg-app wz-noise relative flex min-h-screen flex-col">
      {/* توهج زمردي علوي سينمائي */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-48"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 70%)",
        }}
      />
      <main className={showNav ? "relative z-10 mx-auto w-full max-w-3xl flex-1 pb-40" : "relative z-10 mx-auto w-full max-w-3xl flex-1"}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
