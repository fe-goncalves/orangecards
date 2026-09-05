"use client";

import Image from "next/image";
import type { Card, ClaimMap } from "@/lib/types";
import { displayImagePath, publicLabel, resolveImageUrl } from "@/lib/cards";

type Props = {
  cards: Card[];
  claims: ClaimMap;
  onOpen: (card: Card) => void;
};

export function SharedCardGrid({ cards, claims, onOpen }: Props) {
  if (cards.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-muted">
        Nenhum card nesta coleção.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {cards.map((card) => {
        const claim = claims[card.id];
        const isOwned = Boolean(claim);
        const isLe = Boolean(claim?.is_le);
        const imgUrl = resolveImageUrl(
          isOwned ? displayImagePath(card, isLe) : card.image_path
        );

        return (
          <li key={card.id}>
            <button
              type="button"
              onClick={() => onOpen(card)}
              className={`group relative aspect-card w-full overflow-hidden rounded-md text-left transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint ${
                isLe
                  ? "ring-1 ring-gold/50"
                  : isOwned
                    ? "ring-1 ring-white/10 hover:ring-white/25"
                    : "opacity-40 hover:opacity-55"
              }`}
              aria-label={`#${publicLabel(card)}${isOwned ? "" : " — não conquistado"}`}
            >
              {isOwned && imgUrl ? (
                <Image
                  src={imgUrl}
                  alt={card.title || publicLabel(card)}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized={imgUrl.endsWith(".svg")}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                  <span className="font-slot select-none text-[clamp(1.75rem,8vw,2.75rem)] leading-none text-ink-faint">
                    #{publicLabel(card)}
                  </span>
                </div>
              )}

              {isLe && (
                <span className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-[#1a1400] bg-gold/90">
                  LE
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
