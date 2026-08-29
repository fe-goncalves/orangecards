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
import { Icon } from "@/components/Icon";

type Props = {
  params: Promise<{ user: string }>;
};

interface PublicCollectionResponse {
  ok: boolean;
  user_id?: string;
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
  const title = `COLEÇÃO DE ${decoded.toUpperCase()} | ORANGE CARDS`;
  const description = `CONFIRA A COLEÇÃO OFICIAL DA SEASON 8 DE ${decoded.toUpperCase()} NA ORANGE CARDS!`;

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
            className="glass-btn px-3.5 py-1.5 text-xs font-bold text-mint sm:text-sm"
          >
            Ir para Home
          </Link>
        }
      >
        <div className="my-auto flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-surface-2">
            <Icon name="user" size={32} className="text-ink-muted" />
          </div>
          <h1 className="font-display text-2xl font-black uppercase text-ink sm:text-3xl">
            COLECIONADOR NÃO ENCONTRADO
          </h1>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-ink-muted sm:text-sm">
            Não encontramos nenhuma coleção associada ao usuário &ldquo;{identifier}&rdquo;.
            Verifique o link ou comece sua própria coleção agora.
          </p>
          <Link
            href="/"
            className="glass-btn mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#04140e] bg-mint shadow-lg sm:text-sm"
          >
            <span>Ver Coleção Geral</span>
            <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </SiteShell>
    );
  }

  const claims: ClaimMap = result.claims ?? {};
  const totalClaimed = result.stats?.total_claimed ?? Object.keys(claims).length;
  const totalLe = result.stats?.total_le ?? 0;
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
