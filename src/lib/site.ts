/** URL canônica do site público (produção). */
export const DEFAULT_SITE_URL = "https://cards.copaorange.com.br";

export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
}

export function getShareCollectionUrl(identifier: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}/u/${encodeURIComponent(identifier.trim())}`;
}
