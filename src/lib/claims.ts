import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClaimMap } from "@/lib/types";

const CACHE_PREFIX = "oc.claims.v1.";

export type ClaimsFetchResult =
  | { ok: true; userId: string; claims: ClaimMap }
  | { ok: false; error: string };

function cacheKey(userId: string) {
  return `${CACHE_PREFIX}${userId}`;
}

export function mergeClaims(base: ClaimMap, incoming: ClaimMap): ClaimMap {
  const next: ClaimMap = { ...base };
  for (const [cardId, claim] of Object.entries(incoming)) {
    const prev = next[cardId];
    if (!prev) {
      next[cardId] = claim;
      continue;
    }
    next[cardId] = {
      is_le: Boolean(prev.is_le || claim.is_le),
      claimed_at:
        prev.claimed_at && claim.claimed_at
          ? prev.claimed_at <= claim.claimed_at
            ? prev.claimed_at
            : claim.claimed_at
          : prev.claimed_at || claim.claimed_at,
    };
  }
  return next;
}

export function readCachedClaims(userId: string): ClaimMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(cacheKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ClaimMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeCachedClaims(userId: string, claims: ClaimMap): void {
  if (typeof window === "undefined") return;
  const count = Object.keys(claims).length;
  if (count === 0) {
    const existing = readCachedClaims(userId);
    if (Object.keys(existing).length > 0) return;
  }
  try {
    window.localStorage.setItem(cacheKey(userId), JSON.stringify(claims));
  } catch {
    // quota / private mode — ignore
  }
}

export function clearCachedClaims(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(cacheKey(userId));
  } catch {
    // ignore
  }
}

export function clearAllCachedClaims(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

/** Nunca devolve ok:true com wipe acidental: erro de rede/auth = ok:false. */
export async function fetchUserClaims(
  supabase: SupabaseClient,
  userId: string
): Promise<ClaimsFetchResult> {
  const { data, error } = await supabase.rpc("get_my_collection");

  if (error) {
    return { ok: false, error: error.message };
  }

  const payload = data as {
    ok?: boolean;
    user_id?: string;
    error?: string;
    claims?: Record<string, { is_le?: boolean; claimed_at?: string }>;
  } | null;

  if (!payload?.ok) {
    return { ok: false, error: payload?.error || "not_authenticated" };
  }

  if (payload.user_id && payload.user_id !== userId) {
    return { ok: false, error: "user_mismatch" };
  }

  const claims: ClaimMap = {};
  for (const [cardId, row] of Object.entries(payload.claims ?? {})) {
    claims[cardId] = {
      is_le: Boolean(row?.is_le),
      claimed_at: row?.claimed_at || new Date().toISOString(),
    };
  }

  return { ok: true, userId, claims };
}
