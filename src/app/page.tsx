import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  CARD_SELECT,
  COLLECTION_SELECT,
  DEMO_COLLECTION,
  getDemoCards,
  hasSupabaseEnv,
} from "@/lib/demo-data";
import type { Card, ClaimMap, Collection } from "@/lib/types";
import { AlbumApp } from "@/components/AlbumApp";

type PageProps = {
  searchParams: Promise<{ card?: string }>;
};

async function loadAlbum() {
  if (!hasSupabaseEnv()) {
    return {
      collection: DEMO_COLLECTION,
      cards: getDemoCards(),
      claims: {} as ClaimMap,
      user: null,
      demoMode: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: collection } = await supabase
    .from("collections")
    .select(COLLECTION_SELECT)
    .eq("is_active", true)
    .maybeSingle();

  let cards: Card[] = [];
  if (collection) {
    const { data } = await supabase
      .from("cards")
      .select(CARD_SELECT)
      .eq("collection_id", collection.id)
      .eq("is_public", true)
      .order("order_display", { ascending: true });
    cards = (data as Card[]) ?? [];
  }

  const claims: ClaimMap = {};
  if (user) {
    const { data: claimRows } = await supabase
      .from("claims")
      .select("card_id, is_le, claimed_at")
      .eq("user_id", user.id);
    for (const row of claimRows ?? []) {
      claims[row.card_id] = {
        is_le: Boolean(row.is_le),
        claimed_at: row.claimed_at,
      };
    }
  }

  return {
    collection: (collection as Collection | null) ?? null,
    cards,
    claims,
    user,
    demoMode: false,
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const album = await loadAlbum();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-ink-muted">
          Carregando coleção…
        </div>
      }
    >
      <AlbumApp
        collection={album.collection}
        cards={album.cards}
        initialClaims={album.claims}
        initialUser={album.user}
        initialCardCode={params.card ?? null}
        demoMode={album.demoMode}
      />
    </Suspense>
  );
}
