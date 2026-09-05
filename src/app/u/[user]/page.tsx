import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CARD_SELECT,
  COLLECTION_SELECT,
  DEMO_COLLECTION,
  getDemoCards,
  hasSupabaseEnv,
} from "@/lib/demo-data";
import type { Card, ClaimMap, Collection } from "@/lib/types";
import { SharedAlbumApp } from "@/components/SharedAlbumApp";
import { SiteShell } from "@/components/SiteShell";

type Props = {
  params: Promise<{ user: string }>;
};

interface PublicCollectionResponse {
  ok: boolean;
  nickname?: string;
  claims?: Record<string, { is_le: boolean; claimed_at: string }>;
  stats?: {
    total_claimed: number;
    total_le: number;
  };
  error?: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user: userParam } = await params;
  const decoded = decodeURIComponent(userParam).trim();
  const title = `Coleção de ${decoded} | Orange Cards`;
  const description = `Coleção Season 8 de ${decoded} na Orange Cards.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: ["/brand/icon.svg"],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/brand/icon.svg"],
    },
  };
}

export default async function SharedUserPage({ params }: Props) {
  const { user: userParam } = await params;
  const identifier = decodeURIComponent(userParam).trim();

  if (!hasSupabaseEnv()) {
    // Modo Demo fallback
    return (
      <SharedAlbumApp
        nickname={identifier}
        collection={DEMO_COLLECTION}
        cards={getDemoCards()}
        claims={{}}
        totalClaimed={0}
        totalLe={0}
      />
    );
  }

  const supabase = await createClient();

  // 1. Carrega a coleção ativa e seus cards públicos
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

  // 2. Chama a RPC pública para obter os claims do usuário
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_public_collection_by_user",
    { p_identifier: identifier }
  );

  const result = rpcData as PublicCollectionResponse | null;

  if (rpcError || !result || !result.ok) {
    return (
      <SiteShell
        right={
          <Link
            href="/"
            className="text-xs font-medium text-ink-muted transition hover:text-mint sm:text-sm"
          >
            Início
          </Link>
        }
      >
        <div className="my-auto flex flex-col items-center justify-center py-20 text-center">
          <h1 className="font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">
            Colecionador não encontrado
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
            Nada associado a &ldquo;{identifier}&rdquo;. Confira o link ou comece a
            sua coleção.
          </p>
          <Link
            href="/"
            className="mt-6 text-sm text-mint transition hover:text-ink"
          >
            Ir para o álbum
          </Link>
        </div>
      </SiteShell>
    );
  }

  const claims: ClaimMap = result.claims ?? {};
  const totalClaimed = cards.filter((c) => Boolean(claims[c.id])).length;
  const totalLe = cards.filter((c) => Boolean(claims[c.id]?.is_le)).length;
  const nickname = result.nickname || identifier;

  return (
    <SharedAlbumApp
      nickname={nickname}
      collection={(collection as Collection | null) ?? null}
      cards={cards}
      claims={claims}
      totalClaimed={totalClaimed}
      totalLe={totalLe}
    />
  );
}
