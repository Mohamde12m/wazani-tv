// Generates clean, professional SVG logos as data URIs.
// Used for channel/team/tournament logos when no external asset is available.
// Deterministic color from name so each entity keeps a stable identity.

const PALETTE: [string, string][] = [
  ["#0b6e4f", "#0f9b6e"], // emerald
  ["#1b7a5a", "#2bb37d"],
  ["#0e7c66", "#16a085"],
  ["#b8860b", "#d4a017"], // gold
  ["#9c6b1f", "#c9962e"],
  ["#2e7d5b", "#43a974"],
  ["#0a5c45", "#0e8a64"],
  ["#7a5c2e", "#a37a3e"],
  ["#1f6f5c", "#2fa37f"],
  ["#5a7d52", "#7aa56e"],
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initials(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("");
}

export function svgLogo(name: string, opts?: { shape?: "circle" | "shield" | "square"; size?: number }): string {
  const shape = opts?.shape ?? "circle";
  const size = opts?.size ?? 128;
  const h = hashStr(name);
  const [c1, c2] = PALETTE[h % PALETTE.length];
  const text = initials(name).toUpperCase();
  const gradId = `g${h}`;
  let body = "";
  if (shape === "circle") {
    body = `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="url(#${gradId})"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>`;
  } else if (shape === "square") {
    body = `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>
      <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="20" fill="url(#${gradId})"/>
      <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="20" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>`;
  } else {
    // shield
    body = `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>
      <path d="M${size / 2} 4 L${size - 8} ${size * 0.22} L${size - 8} ${size * 0.6} Q${size - 8} ${size - 8} ${size / 2} ${size - 6} Q8 ${size - 8} 8 ${size * 0.6} L8 ${size * 0.22} Z" fill="url(#${gradId})"/>
      <path d="M${size / 2} 4 L${size - 8} ${size * 0.22} L${size - 8} ${size * 0.6} Q${size - 8} ${size - 8} ${size / 2} ${size - 6} Q8 ${size - 8} 8 ${size * 0.6} L8 ${size * 0.22} Z" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>`;
  }
  const fontSize = Math.round(size * (text.length > 1 ? 0.34 : 0.5));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-weight="700" font-size="${fontSize}" fill="#ffffff">${text}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
