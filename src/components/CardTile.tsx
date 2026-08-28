"use client";

import Image from "next/image";
import type { Card, CardUiStatus } from "@/lib/types";
import { displayImagePath, isDropPast, publicLabel, resolveImageUrl } from "@/lib/cards";
import { TradingCardPack } from "./TradingCardPack";

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
  const isLive = status === "live";
  const isPastUncollected = !isOwned && isDropPast(card);
  const isEmptySlot = status === "empty_slot" && !isPastUncollected;

  // 1. Drop Ao Vivo: renderiza o Trading Card Booster Pack realista
  if (isLive) {
    return (
      <TradingCardPack
        cardNumber={publicLabel(card)}
        isInteractive={true}
        badgeLabel="Drop Ao Vivo"
        onClick={() => onOpen(linkId)}
      />
    );
  }

  // 2. Drop já encerrado e usuário não colecionou: card visível com baixa opacidade e não clicável
  if (isPastUncollected) {
    const regularImg = resolveImageUrl(card.image_path);
    return (
      <div
        className="group relative aspect-card w-full overflow-hidden rounded-md border border-white/[0.04] bg-[#0c0d0c] opacity-25 grayscale-[25%] transition-opacity duration-300 hover:opacity-40"
        title={`#${publicLabel(card)} — Drop Encerrado`}
      >
        {regularImg ? (
          <Image
            src={regularImg}
            alt={card.title || publicLabel(card)}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="pointer-events-none object-cover"
            unoptimized={regularImg.endsWith(".svg")}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
            <span className="font-slot select-none text-[clamp(2rem,8vw,3.5rem)] leading-none text-ink-faint">
              #{publicLabel(card)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-1.5 left-1.5 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-ink-muted">
          #{publicLabel(card)} · Encerrado
        </div>
      </div>
    );
  }

  // 3. Card Colecionado ou Slot Vazio
  const showRevealedArt = isOwned;
  const img = showRevealedArt
    ? resolveImageUrl(displayImagePath(card, Boolean(isLe)))
    : "";

  let frameClass = "card-slot-empty";
  if (isOwned) frameClass = "card-revealed";

  const shellClass = `group album-tile relative aspect-card w-full overflow-hidden text-left ${frameClass} ${
    locked
      ? "cursor-default select-none"
      : dimmed
        ? "opacity-45 hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
  }`;

  return (
    <button
      type="button"
      onClick={() => onOpen(linkId)}
      className={shellClass}
      aria-label={`#${publicLabel(card)}${card.title ? ` — ${card.title}` : ""}`}
    >
      {isOwned && (
        <span className="album-frame-glow absolute inset-0 z-[1]" aria-hidden />
      )}

      {/* Card Já Aberto & Revelado na Coleção */}
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

      {/* Slot Vazio (Ainda não dropado / Não revelado) */}
      {isEmptySlot && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
          <span className="font-slot select-none text-[clamp(2.5rem,11vw,4.5rem)] leading-none text-ink-faint">
            #{publicLabel(card)}
          </span>
        </div>
      )}

      {/* Badge LE conquistado */}
      {isLe && isOwned && (
        <span className="absolute right-1 top-1 z-[2] bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#1a1400] shadow-sm">
          LE
        </span>
      )}
    </button>
  );
}
