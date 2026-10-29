"use client";

import * as React from "react";
import { AppShell } from "@/components/shared/app-shell";
import { TopHeader } from "@/components/shared/top-header";
import { SplashScreen } from "@/components/shared/splash-screen";
import { useNav } from "@/stores/nav";
import { HomeView } from "@/components/views/home-view";
import { ChannelsView } from "@/components/views/channels-view";
import { MatchesView } from "@/components/views/matches-view";
import { FavoritesView } from "@/components/views/favorites-view";
import { MoreView } from "@/components/views/more-view";
import { PlayerView } from "@/components/views/player-view";
import { MatchPlayerView } from "@/components/views/match-player-view";
import { TournamentsView } from "@/components/views/tournaments-view";
import { TournamentView } from "@/components/views/tournament-view";
import { SearchView } from "@/components/views/search-view";
import { AdminView } from "@/components/views/admin-view";
import { startReminderChecker } from "@/lib/reminders";

const MAIN_VIEWS = new Set(["home", "channels", "matches", "favorites", "more"]);

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  player: { title: "مشاهدة القناة" },
  "match-player": { title: "مشاهدة المباراة" },
  tournaments: { title: "البطولات", subtitle: "أهم البطولات الرياضية" },
  tournament: { title: "تفاصيل البطولة" },
  search: { title: "البحث" },
  admin: { title: "لوحة التحكم" },
};

export default function Home() {
  const view = useNav((s) => s.view);
  const isMain = MAIN_VIEWS.has(view.name);
  const meta = TITLES[view.name];
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    startReminderChecker();
  }, []);

  // أظهر شاشة البداية فقط في المتصفح (وليس في SSR) لتجنب hydration mismatch
  // + فقط عند فتح التطبيق (وليس عند التنقل)
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    // تحقق إذا تم عرض شاشة البداية في هذه الجلسة
    const splashShown = sessionStorage.getItem("splash_shown");
    if (splashShown === "true") {
      setShowSplash(false);
    } else {
      sessionStorage.setItem("splash_shown", "true");
    }
  }, []);

  // لا تعرض SplashScreen في SSR (mounted=false) — فقط بعد mount في المتصفح
  const shouldShowSplash = mounted && showSplash;

  return (
    <>
      {shouldShowSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <AppShell>
        {!isMain && <TopHeader title={meta?.title} subtitle={meta?.subtitle} showBack />}
        {view.name === "home" && <HomeView />}
        {view.name === "channels" && <ChannelsView country={view.country} category={view.category} />}
        {view.name === "matches" && <MatchesView tab={view.tab} />}
        {view.name === "favorites" && <FavoritesView />}
        {view.name === "more" && <MoreView />}
        {view.name === "player" && <PlayerView channelId={view.channelId} />}
        {view.name === "match-player" && <MatchPlayerView matchId={view.matchId} />}
        {view.name === "tournaments" && <TournamentsView />}
        {view.name === "tournament" && <TournamentView id={view.id} />}
        {view.name === "search" && <SearchView initialQuery={view.q} />}
        {view.name === "admin" && <AdminView />}
      </AppShell>
    </>
  );
}
