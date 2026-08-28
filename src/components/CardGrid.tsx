"use client";

import type { Card, CardUiStatus, ClaimMap } from "@/lib/types";
import { CardTile } from "./CardTile";

type Props = {
  cards: Card[];
  statusOf: (card: Card) => CardUiStatus;
  claims?: ClaimMap;
  isLoggedIn: boolean;
  onOpen: (code: string) => void;
};

export function CardGrid({
  cards,
  statusOf,
  claims = {},
  isLoggedIn,
  onOpen,
}: Props) {
  if (cards.length === 0) {
    return (
      <p className="py-16 text-center text-ink-muted">Nenhum card na coleção.</p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
      {cards.map((card, i) => {
        const owned = Boolean(claims[card.id]);
        return (
          <li
            key={card.id}
            className="animate-rise"
            style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
          >
            <CardTile
              card={card}
              status={statusOf(card)}
              isLe={Boolean(claims[card.id]?.is_le)}
              locked={!isLoggedIn}
              dimmed={isLoggedIn && !owned}
              onOpen={onOpen}
            />
          </li>
        );
      })}
    </ul>
  );
}
