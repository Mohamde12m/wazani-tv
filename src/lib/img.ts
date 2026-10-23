/**
 * Helpers for normalizing image URLs so external logos always render.
 *
 * External http(s) image URLs are routed through the server-side image
 * proxy (/api/img?url=...) to bypass CORS, hotlink protection, and
 * client-side rate limiting (e.g. Wikipedia 429s). Data URIs and
 * relative paths are returned untouched.
 */

/** Returns true for absolute external http/https URLs. */
function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

/**
 * Convert an image URL for use in <img src>. External URLs are proxied
 * through /api/img so they render reliably. Data: URIs, blob: URIs, and
 * relative paths are returned as-is.
 */
export function imgUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) {
    return src;
  }
  if (isExternalUrl(src)) {
    return `/api/img?url=${encodeURIComponent(src)}`;
  }
  return src;
}
