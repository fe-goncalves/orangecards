import type { Card, CardUiStatus } from "./types";

export function resolveImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = imagePath.replace(/^\/+/, "");
  if (key.startsWith("cards/")) key = key.slice(6);
  if (!base) return imagePath.startsWith("/") ? imagePath : `/${key}`;
  return `${base}/storage/v1/object/public/cards/${key}`;
}

/** Arte do dono: LE substitui a padrão. */
export function displayImagePath(card: Card, isLe: boolean): string {
  if (isLe && card.le_image_path) return card.le_image_path;
  return card.image_path;
}

export function isDropLive(card: Card, now: Date = new Date()): boolean {
  if (!card.is_active || !card.is_public) return false;
  if (!card.drop_starts_at || !card.drop_ends_at) return false;
  const start = new Date(card.drop_starts_at);
  const end = new Date(card.drop_ends_at);
  return now >= start && now <= end;
}

export function isDropUpcoming(card: Card, now: Date = new Date()): boolean {
  if (!card.is_active || !card.is_public) return false;
  if (!card.drop_starts_at) return false;
  return now < new Date(card.drop_starts_at);
}

export function isDropPast(card: Card, now: Date = new Date()): boolean {
  if (!card.drop_ends_at) return false;
  return now > new Date(card.drop_ends_at);
}

/**
 * Regras de view:
 * - owned → arte (LE se is_le)
 * - live → booster + CTA
 * - upcoming → booster + countdown
 * - demais → empty_slot
 */
export function getCardUiStatus(
  card: Card,
  owned: boolean,
  _isLoggedIn: boolean,
  now: Date = new Date()
): CardUiStatus {
  if (owned) return "owned";
  if (!card.is_public) return "empty_slot";
  if (!card.is_active) return "empty_slot";
  if (isDropLive(card, now)) return "live";
  if (isDropUpcoming(card, now)) return "upcoming";
  return "empty_slot";
}

/** Contagem regressiva DD:HH:MM:SS até um instante. */
export function formatCountdownDHMS(
  targetIso: string,
  now: Date = new Date()
): string {
  const ms = Math.max(0, new Date(targetIso).getTime() - now.getTime());
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(d).padStart(2, "0")}:${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatCountdown(endsAt: string, now: Date = new Date()): string {
  const ms = new Date(endsAt).getTime() - now.getTime();
  if (ms <= 0) return "Encerrado";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function leRemaining(card: Card): number {
  if (!card.le_enabled) return 0;
  return Math.max(0, card.le_quota - card.le_awarded);
}

export function publicLabel(card: Card): string {
  return card.number || card.code;
}

export async function downloadCardImage(
  imagePath: string,
  filename: string
): Promise<void> {
  const url = resolveImageUrl(imagePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao baixar a imagem");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
