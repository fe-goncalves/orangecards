"use client";

import Image from "next/image";
import type { Card, CardUiStatus } from "@/lib/types";
import { displayImagePath, publicLabel, resolveImageUrl } from "@/lib/cards";

type Props = {
  card: Card;
  status: CardUiStatus;
  isLe?: boolean;
  locked?: boolean;
  dimmed?: boolean;
  onOpen: (code: string) => void;
};

export function CardTile({
  card,
  status,
  isLe,
  locked = false,
  dimmed = false,
  onOpen,
}: Props) {
  const linkId = card.number || card.code;
  const showArt = status === "live" || status === "owned";
  const img = showArt
    ? resolveImageUrl(displayImagePath(card, Boolean(isLe)))
    : "";
  const isEmpty = !showArt;

  const frameClass = isEmpty ? "card-slot-empty" : "card-revealed";

  const shellClass = `group album-tile relative aspect-card w-full overflow-hidden text-left ${frameClass} ${
    locked
      ? showArt
        ? "cursor-default select-none opacity-40 hover:opacity-80"
        : "cursor-default select-none"
      : dimmed
        ? "opacity-45 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
  }`;

  const inner = (
    <>
      {!isEmpty && (
        <span className="album-frame-glow absolute inset-0 z-[1]" aria-hidden />
      )}

      {showArt && img ? (
        <Image
          src={img}
          alt=""
          fill
          sizes="(max-width:768px) 50vw, 25vw"
          className="pointer-events-none object-cover"
          unoptimized={img.endsWith(".svg")}
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
          <span className="font-slot select-none text-[clamp(2.5rem,11vw,4.5rem)] leading-none text-ink-faint">
            {publicLabel(card)}
          </span>
        </div>
      )}

      {status === "live" && !locked && (
        <span className="absolute left-1 top-1 z-[2] animate-pulse-soft bg-mint px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#04140e]">
          Drop
        </span>
      )}
      {isLe && status === "owned" && (
        <span className="absolute right-1 top-1 z-[2] bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#1a1400]">
          LE
        </span>
      )}
    </>
  );

  if (locked) {
    return (
      <div
        className={shellClass}
        aria-label={publicLabel(card)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(linkId)}
      className={shellClass}
      aria-label={`${publicLabel(card)}${card.title ? ` — ${card.title}` : ""}`}
    >
      {inner}
    </button>
  );
}
