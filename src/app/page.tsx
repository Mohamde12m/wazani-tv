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

/** Error Boundary يلتقط الخطأ ويعرض المكون المسبب */
class ErrorBoundary extends React.Component<
  { name: string; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { name: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name}]`, error, info);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 20, fontFamily: "sans-serif", direction: "rtl", background: "#fef2f2", color: "#991b1b" }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>خطأ في: {this.props.name}</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginBottom: 8 }}>
            {this.state.error.message}
          </pre>
          <details style={{ fontSize: 11 }}>
            <summary>تفاصيل</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error.stack}</pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 10, padding: "6px 12px", background: "#0b6e4f", color: "white", border: "none", borderRadius: 4 }}
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

  React.useEffect(() => {
    startReminderChecker();
  }, []);

  return (
    <ErrorBoundary name="App">
      <AppShell>
        {!isMain && <TopHeader title={meta?.title} subtitle={meta?.subtitle} showBack />}
        <ErrorBoundary name="HomeView">
          {view.name === "home" && <HomeView />}
        </ErrorBoundary>
        <ErrorBoundary name="ChannelsView">
          {view.name === "channels" && <ChannelsView country={view.country} category={view.category} />}
        </ErrorBoundary>
        <ErrorBoundary name="MatchesView">
          {view.name === "matches" && <MatchesView tab={view.tab} />}
        </ErrorBoundary>
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
