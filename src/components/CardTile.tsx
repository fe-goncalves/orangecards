"use client";

import Image from "next/image";
import type { Card, CardUiStatus } from "@/lib/types";
import { displayImagePath, publicLabel, resolveImageUrl } from "@/lib/cards";
import { Icon } from "./Icon";

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
  const isOwned = status === "owned";
  const isUnopenedLive = status === "live"; // Drop ao vivo, pacotinho aguardando abertura!
  const isEmptySlot = status === "empty_slot";

  const showRevealedArt = isOwned;
  const img = showRevealedArt
    ? resolveImageUrl(displayImagePath(card, Boolean(isLe)))
    : "";

  let frameClass = "card-slot-empty";
  if (isOwned) frameClass = "card-revealed";
  else if (isUnopenedLive) frameClass = "card-unopened-silhouette";

  const shellClass = `group album-tile relative aspect-card w-full overflow-hidden text-left ${frameClass} ${
    locked
      ? isUnopenedLive
        ? "cursor-pointer select-none opacity-90 hover:opacity-100 hover:scale-[1.02] transition duration-300"
        : "cursor-default select-none"
      : isUnopenedLive
        ? "cursor-pointer select-none opacity-100 hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,171,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        : dimmed
          ? "opacity-45 hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
          : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
  }`;

  const inner = (
    <>
      {isOwned && (
        <span className="album-frame-glow absolute inset-0 z-[1]" aria-hidden />
      )}

      {/* 1. Card Já Aberto & Revelado no Álbum */}
      {showRevealedArt && img && (
        <Image
          src={img}
          alt=""
          fill
          sizes="(max-width:768px) 50vw, 25vw"
          className="pointer-events-none object-cover"
          unoptimized={img.endsWith(".svg")}
          draggable={false}
        />
      )}

      {/* 2. Card com Drop Ao Vivo (Pacotinho para Abrir) */}
      {isUnopenedLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-3">
          {/* Badge pulsante de Novidade */}
          <div className="animate-badge-pulse flex items-center gap-1.5 rounded-full bg-mint px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#04140e] shadow-md">
            <Icon name="sparkles" size={11} />
            <span>Abrir Pacote</span>
          </div>

          {/* Silhueta central com o número */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="absolute -inset-4 rounded-full bg-mint/10 blur-md" />
            <span className="font-slot relative select-none text-[clamp(2.5rem,10vw,4rem)] leading-none text-mint/80 drop-shadow-[0_0_12px_rgba(0,255,171,0.4)]">
              {publicLabel(card)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-medium text-mint/90">
            <Icon name="zap" size={11} />
            <span>Drop Ao Vivo</span>
          </div>
        </div>
      )}

      {/* 3. Slot Vazio (Não revelado / Inativo) */}
      {isEmptySlot && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
          <span className="font-slot select-none text-[clamp(2.5rem,11vw,4.5rem)] leading-none text-ink-faint">
            {publicLabel(card)}
          </span>
        </div>
      )}

      {/* Badge LE conquistado */}
      {isLe && isOwned && (
        <span className="absolute right-1 top-1 z-[2] bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#1a1400] shadow-sm">
          LE
        </span>
      )}
    </>
  );

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
