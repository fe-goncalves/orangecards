"use client";

import { useState } from "react";
import Image from "next/image";
import type { Card, ClaimMap } from "@/lib/types";
import {
  displayImagePath,
  downloadCardImage,
  publicLabel,
  resolveImageUrl,
} from "@/lib/cards";

type Props = {
  cards: Card[];
  claims: ClaimMap;
  demo?: boolean;
};

export function UserAlbum({ cards, claims, demo }: Props) {
  const list = cards.filter((c) => Boolean(claims[c.id]));

  if (list.length === 0) {
    return (
      <p className="py-12 text-center text-ink-muted">
        {demo
          ? "Sem claims no modo demo."
          : "Nenhum card colecionado ainda. Fique de olho no próximo drop."}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-[var(--gap-grid)] sm:grid-cols-3 lg:grid-cols-4">
      {list.map((card) => (
        <OwnedCard
          key={card.id}
          card={card}
          isLe={claims[card.id]?.is_le ?? false}
        />
      ))}
    </ul>
  );
}

function OwnedCard({ card, isLe }: { card: Card; isLe: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const path = displayImagePath(card, isLe);
  const img = resolveImageUrl(path);
  const label = publicLabel(card);

  async function onDownload() {
    setBusy(true);
    setErr(null);
    try {
      await downloadCardImage(path, isLe ? `${label}-LE.png` : `${label}.png`);
    } catch {
      setErr("Não foi possível baixar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      className={`overflow-hidden rounded-[var(--radius-sm)] bg-surface ${isLe ? "card-frame-le" : "card-frame"}`}
    >
      <div className="relative aspect-card bg-surface-2">
        {img && (
          <Image
            src={img}
            alt={card.title || label}
            fill
            className="object-cover"
            sizes="280px"
            unoptimized={img.endsWith(".svg")}
          />
        )}
        {isLe && (
          <span className="absolute left-2 top-2 rounded-[var(--radius-sm)] bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-[#1a1400]">
            LE
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <p className="font-mono text-xs text-mint">#{label}</p>
        <h2 className="font-display text-lg text-ink">{card.title || "—"}</h2>
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="btn btn-ghost w-full disabled:opacity-60"
        >
          {busy ? "…" : "Baixar"}
        </button>
        {err && <p className="text-xs text-danger">{err}</p>}
      </div>
    </li>
  );
}
