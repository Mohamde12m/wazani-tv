"use client";

import * as React from "react";
import { AppShell } from "@/components/shared/app-shell";
import { TopHeader } from "@/components/shared/top-header";
import { useNav } from "@/stores/nav";
import { HomeView } from "@/components/views/home-view";
import { ChannelsView } from "@/components/views/channels-view";
import { MatchesView } from "@/components/views/matches-view";
import { FavoritesView } from "@/components/views/favorites-view";
import { MoreView } from "@/components/views/more-view";
import { PlayerView } from "@/components/views/player-view";
import { TournamentsView } from "@/components/views/tournaments-view";
import { TournamentView } from "@/components/views/tournament-view";
import { SearchView } from "@/components/views/search-view";
import { AdminView } from "@/components/views/admin-view";
import { startReminderChecker } from "@/lib/reminders";

const MAIN_VIEWS = new Set(["home", "channels", "matches", "favorites", "more"]);

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  player: { title: "مشاهدة القناة" },
  tournaments: { title: "البطولات", subtitle: "أهم البطولات الرياضية" },
  tournament: { title: "تفاصيل البطولة" },
  search: { title: "البحث" },
  admin: { title: "لوحة التحكم" },
};

/** Error Boundary صريح لرؤية الأخطاء بدل الشاشة البيضاء */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 20, fontFamily: "sans-serif", direction: "rtl" }}>
          <h1 style={{ color: "#dc2626", fontSize: 18 }}>حدث خطأ في التطبيق</h1>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#666" }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#999", marginTop: 10 }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 15, padding: "8px 16px", background: "#0b6e4f", color: "white", border: "none", borderRadius: 6 }}
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Home() {
  const view = useNav((s) => s.view);
  const isMain = MAIN_VIEWS.has(view.name);
  const meta = TITLES[view.name];

  // ابدأ فاحص تذكير المباريات عند تحميل التطبيق
  React.useEffect(() => {
    startReminderChecker();
  }, []);

  return (
    <ErrorBoundary>
      <AppShell>
        {!isMain && <TopHeader title={meta?.title} subtitle={meta?.subtitle} showBack />}
        {view.name === "home" && <HomeView />}
        {view.name === "channels" && <ChannelsView country={view.country} category={view.category} />}
        {view.name === "matches" && <MatchesView tab={view.tab} />}
        {view.name === "favorites" && <FavoritesView />}
        {view.name === "more" && <MoreView />}
        {view.name === "player" && <PlayerView channelId={view.channelId} />}
        {view.name === "tournaments" && <TournamentsView />}
        {view.name === "tournament" && <TournamentView id={view.id} />}
        {view.name === "search" && <SearchView initialQuery={view.q} />}
        {view.name === "admin" && <AdminView />}
      </AppShell>
    </ErrorBoundary>
  );
}
