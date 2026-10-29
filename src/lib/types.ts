// Shared client-side types mirroring the API payloads.

export interface Country {
  id: string;
  name: string;
  code: string;
  flag?: string | null;
  order: number;
  visible: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  order: number;
  visible: boolean;
  isSports: boolean;
}

export interface Channel {
  id: string;
  name: string;
  nameAr?: string | null;
  logo?: string | null;
  countryId?: string | null;
  country?: Country | null;
  categoryId?: string | null;
  category?: Category | null;
  streamUrl?: string | null;
  streamType: string;
  active: boolean;
  featured: boolean;
  verified: boolean;
  demo: boolean;
  order: number;
}

export interface Team {
  id: string;
  name: string;
  nameAr?: string | null;
  logo?: string | null;
  tournamentId?: string | null;
}

export interface Tournament {
  id: string;
  name: string;
  nameAr?: string | null;
  logo?: string | null;
  country?: string | null;
  type: string;
  order: number;
  visible: boolean;
  _count?: { matches: number; teams: number };
}

export interface Match {
  id: string;
  homeName: string;
  awayName: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  tournamentId?: string | null;
  tournament?: Tournament | null;
  tournamentName?: string | null;
  kickoff: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  stadium?: string | null;
  channelId?: string | null;
  channel?: Channel | null;
  featured: boolean;
  demo: boolean;
  /// رابط البث — يُضاف يدويًا من لوحة الإدارة
  streamUrl?: string | null;
  /// نوع البث: hls | mp4 | youtube | none
  streamType?: string;
  /// المعرف الخارجي من theSportsDB
  externalId?: string | null;
  /// القناة الناقلة (نص حر)
  broadcaster?: string | null;
}

/** مواضع الإعلانات المدعومة في التطبيق. */
export type AdSlotName =
  | "home_top"
  | "home_middle"
  | "home_bottom"
  | "sticky_bottom"
  | "matches_top"
  | "matches_middle"
  | "channels_top"
  | "channels_middle"
  | "favorites_top"
  | "player_top"
  | "more_top";

export interface Ad {
  id: string;
  slot: string;
  label: string;
  type: "image" | "code";
  imageUrl?: string | null;
  linkUrl?: string | null;
  adCode?: string | null;
  active: boolean;
  order: number;
}
