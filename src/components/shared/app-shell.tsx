"use client";

import * as React from "react";
import { BottomNav } from "./bottom-nav";
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
      <main className={showNav ? "mx-auto w-full max-w-3xl flex-1 pb-40" : "mx-auto w-full max-w-3xl flex-1"}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
