"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const pct = totalCards > 0 ? Math.round((totalClaimed / totalCards) * 100) : 0;

  function handleCopyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleShareWhatsApp() {
    if (typeof window === "undefined") return;
    const text = `Confira minha coleção oficial da Season 8 na Orange Cards (${totalClaimed}/${totalCards} cards conquistados):\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <SiteShell
      right={
        <Link
          href="/"
          className="glass-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-mint sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
        >
          <Icon name="sparkles" size={14} />
          <span>Abrir Minha Coleção</span>
        </Link>
      }
    >
      {/* Banner Principal do Colecionador */}
      <section className="mb-6 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-surface/80 to-surface-2/60 p-5 shadow-2xl backdrop-blur-xl sm:mb-8 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-mint/25 via-mint/10 to-transparent border border-mint/30 shadow-[0_0_20px_var(--mint-glow)] sm:h-16 sm:w-16">
              <Icon name="user" size={28} className="text-mint" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-mint sm:text-xs">
                {collection?.name ? `${collection.name} • Coleção Pública` : "Coleção Pública • Season 8"}
              </span>
              <h1 className="font-display text-2xl font-black uppercase tracking-wide text-ink sm:text-3xl md:text-4xl">
                {nickname}
              </h1>
            </div>
          </div>

          {/* Botões de Compartilhar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="glass-btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink sm:px-4 sm:text-sm"
            >
              <Icon name={copied ? "check" : "copy"} size={14} className={copied ? "text-mint" : ""} />
              <span>{copied ? "Link Copiado!" : "Copiar Link"}</span>
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="glass-btn flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#04140e] bg-mint hover:brightness-110 sm:px-4 sm:text-sm"
            >
              <Icon name="share" size={14} />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Estatísticas e Barra de Progresso */}
        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-display text-xl font-bold text-ink sm:text-2xl">
                {totalClaimed}
                <span className="text-ink-muted">/{totalCards}</span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Cards Colecionados ({pct}%)
              </span>
            </div>

            {totalLe > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-bold text-gold shadow-sm">
                <Icon name="sparkles" size={13} />
                <span>{totalLe} Limited Edition{totalLe > 1 ? "s" : ""}</span>
              </span>
            )}
          </div>

          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-surface-3"
            role="progressbar"
            aria-valuenow={totalClaimed}
            aria-valuemin={0}
            aria-valuemax={totalCards}
          >
            <div
              className="h-full bg-gradient-to-r from-mint to-mint-dim transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Grade de Cards */}
      <main className="flex-1">
        <SharedCardGrid
          cards={cards}
          claims={claims}
          onOpen={(card) => setSelectedCard(card)}
        />
      </main>

      {/* Banner / CTA de Conversão no Rodapé */}
      <section className="mt-10 rounded-2xl border border-mint/30 bg-gradient-to-br from-[#061e14] via-[#04140e] to-[#020a07] p-6 text-center shadow-[0_10px_40px_rgba(0,255,171,0.15)] sm:mt-12 sm:p-8">
        <div className="mx-auto flex max-w-xl flex-col items-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Image src="/brand/icon.svg" alt="Orange Cards" width={32} height={32} className="h-8 w-8" />
            <Image src="/brand/wordmark.svg" alt="ORANGE CARDS" width={110} height={12} className="h-2.5 w-auto" />
          </div>
          <h2 className="font-display text-xl font-black uppercase text-white sm:text-2xl">
            CRIE SUA COLEÇÃO NA SEASON 8
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted sm:text-sm">
            Participe dos drops ao vivo, abra seus pacotinhos e dispute as cartas numeradas Limited Edition.
          </p>
          <Link
            href="/"
            className="glass-btn mt-5 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#04140e] bg-mint shadow-xl hover:scale-105 transition-transform"
          >
            <span>Começar Minha Coleção</span>
            <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </section>

      {/* Modal de Exibição de Card */}
      <SharedCardModal
        card={selectedCard}
        isLe={selectedCard ? Boolean(claims[selectedCard.id]?.is_le) : false}
        isOwned={selectedCard ? Boolean(claims[selectedCard.id]) : false}
        onClose={() => setSelectedCard(null)}
      />
    </SiteShell>
  );
}
