"use client";

import { useState } from "react";
import Link from "next/link";
import type { Card, ClaimMap, Collection } from "@/lib/types";
import { SiteShell } from "./SiteShell";
import { SharedCardGrid } from "./SharedCardGrid";
import { SharedCardModal } from "./SharedCardModal";
import { Icon } from "./Icon";

type Props = {
  nickname: string;
  collection: Collection | null;
  cards: Card[];
  claims: ClaimMap;
  totalClaimed: number;
  totalLe: number;
};

export function SharedAlbumApp({
  nickname,
  collection,
  cards,
  claims,
  totalClaimed,
  totalLe,
}: Props) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [copied, setCopied] = useState(false);

  const totalCards = cards.length;
  const seasonLabel = collection?.name?.trim() || "Season 8";

  function handleCopyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareWhatsApp() {
    if (typeof window === "undefined") return;
    const text = `Coleção de ${nickname} — Orange Cards\n${window.location.href}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <SiteShell
      right={
        <Link
          href="/"
          className="text-xs font-medium text-ink-muted transition hover:text-mint sm:text-sm"
        >
          Minha coleção
        </Link>
      }
    >
      <header className="mb-8 sm:mb-10 md:mb-12">
        <p className="text-[11px] tracking-[0.14em] text-ink-faint uppercase">
          {seasonLabel}
        </p>

        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="font-display text-[1.75rem] font-medium leading-tight tracking-tight text-ink sm:text-3xl md:text-[2.25rem]">
            {nickname}
          </h1>

          <div className="flex shrink-0 items-center gap-0.5 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="glass-icon-btn"
              aria-label={copied ? "Link copiado" : "Copiar link"}
              title={copied ? "Copiado" : "Copiar link"}
            >
              <Icon
                name={copied ? "check" : "copy"}
                size={15}
                className={copied ? "text-mint" : undefined}
              />
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="glass-icon-btn"
              aria-label="Compartilhar no WhatsApp"
              title="WhatsApp"
            >
              <Icon name="share" size={15} />
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-ink-muted tabular-nums">
          <span className="text-ink">{totalClaimed}</span>
          <span className="text-ink-faint"> / {totalCards}</span>
          {totalLe > 0 && (
            <span className="text-ink-faint">
              {" "}
              · {totalLe} LE
            </span>
          )}
        </p>
      </header>

      <main className="flex-1">
        <SharedCardGrid
          cards={cards}
          claims={claims}
          onOpen={(card) => setSelectedCard(card)}
        />
      </main>

      <footer className="mt-14 border-t border-white/[0.06] pt-8 text-center sm:mt-16">
        <p className="text-sm text-ink-muted">
          Quer a sua?{" "}
          <Link href="/" className="text-mint transition hover:text-ink">
            Começar coleção
          </Link>
        </p>
      </footer>

      <SharedCardModal
        card={selectedCard}
        isLe={selectedCard ? Boolean(claims[selectedCard.id]?.is_le) : false}
        isOwned={selectedCard ? Boolean(claims[selectedCard.id]) : false}
        onClose={() => setSelectedCard(null)}
      />
    </SiteShell>
  );
}
