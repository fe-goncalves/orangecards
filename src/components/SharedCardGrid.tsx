"use client";

import Image from "next/image";
import type { Card, ClaimMap } from "@/lib/types";
import { displayImagePath, publicLabel, resolveImageUrl } from "@/lib/cards";
import { Icon } from "./Icon";

type Props = {
  cards: Card[];
  claims: ClaimMap;
  onOpen: (card: Card) => void;
};

export function SharedCardGrid({ cards, claims, onOpen }: Props) {
  if (cards.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-white/[0.06] bg-surface/30 p-8 text-center text-sm text-ink-muted">
        Nenhum card cadastrado nesta coleção.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((card) => {
        const claim = claims[card.id];
        const isOwned = Boolean(claim);
        const isLe = Boolean(claim?.is_le);
        const imgUrl = resolveImageUrl(
          isOwned ? displayImagePath(card, isLe) : card.image_path
        );

        return (
          <div
            key={card.id}
            onClick={() => onOpen(card)}
            className={`group relative aspect-card w-full cursor-pointer overflow-hidden rounded-md transition-all duration-300 hover:scale-[1.025] ${
              isLe
                ? "border-2 border-gold shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                : isOwned
                  ? "border border-white/20 shadow-lg hover:border-mint/50"
                  : "border border-white/[0.06] bg-surface-2 opacity-35 grayscale-[50%] hover:opacity-50"
            }`}
          >
            {isOwned && imgUrl ? (
              <Image
                src={imgUrl}
                alt={card.title || publicLabel(card)}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                unoptimized={imgUrl.endsWith(".svg")}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                <span className="font-slot select-none text-[clamp(2.5rem,10vw,3.5rem)] leading-none text-ink-faint">
                  #{publicLabel(card)}
                </span>
              </div>
            )}

            {/* Selo LE se conquistado */}
            {isLe && (
              <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded bg-gradient-to-r from-[#FFF0A5] via-[#D4AF37] to-[#8A6D1C] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#1a1400] shadow-md">
                <Icon name="sparkles" size={9} />
                <span>LE</span>
              </div>
            )}

            {/* Badge de número no rodapé */}
            <div className="absolute bottom-1.5 left-1.5 z-10 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              #{publicLabel(card)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
