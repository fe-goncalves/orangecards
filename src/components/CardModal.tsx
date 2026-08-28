"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import type { Card, CardUiStatus, ClaimResult } from "@/lib/types";
import {
  displayImagePath,
  downloadCardImage,
  formatCountdown,
  leRemaining,
  publicLabel,
  resolveImageUrl,
} from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "./Icon";
import { ModalPortal } from "./ModalPortal";

type Props = {
  card: Card | null;
  status: CardUiStatus | null;
  isLoggedIn: boolean;
  isLe: boolean;
  onClose: () => void;
  onClaimed: (cardId: string, isLe: boolean) => void;
  onRequestLogin: () => void;
};

export function CardModal({
  card,
  status,
  isLoggedIn,
  isLe,
  onClose,
  onClaimed,
  onRequestLogin,
}: Props) {
  const titleId = useId();
  const [tick, setTick] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wonLe, setWonLe] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!card) return;
    setFeedback(null);
    setWonLe(false);
    setFlash(false);
  }, [card?.id]);

  useEffect(() => {
    if (!card || status !== "live" || !card.drop_ends_at) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [card?.id, status, card?.drop_ends_at]);

  useEffect(() => {
    if (!card) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [card, onClose]);

  if (!card || !status) return null;

  const effectiveLe = isLe || wonLe;
  const showArt = status === "live" || status === "owned";
  const img = showArt
    ? resolveImageUrl(displayImagePath(card, effectiveLe))
    : "";
  void tick;

  async function handleClaim() {
    if (!card) return;
    setClaiming(true);
    setFeedback(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("claim_card", {
      p_card_id: card.id,
    });
    setClaiming(false);
    if (error) {
      setFeedback(error.message);
      return;
    }
    const result = data as ClaimResult;
    setFeedback(result.message);
    if (result.ok) {
      setFlash(true);
      if (result.is_le) setWonLe(true);
      onClaimed(card.id, Boolean(result.is_le));
    }
  }

  async function handleDownload() {
    if (!card) return;
    const path = displayImagePath(card, effectiveLe);
    const label = publicLabel(card);
    await downloadCardImage(
      path,
      effectiveLe ? `${label}-LE.png` : `${label}.png`
    );
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[200] flex bg-black"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`relative flex h-dvh w-full flex-col overflow-y-auto md:overflow-hidden md:flex-row md:items-stretch ${flash ? "animate-save-flash" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="glass-icon-btn absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-20 md:right-5 md:top-5"
            aria-label="Fechar"
          >
            <Icon name="close" size={18} />
          </button>

          {/* Card — esquerda / topo */}
          <div className="flex shrink-0 items-center justify-center bg-black px-4 pt-[calc(3rem+env(safe-area-inset-top,0px))] pb-2 md:w-[min(48vw,420px)] md:flex-col md:px-8 md:py-10">
            <div
              className={`relative aspect-card w-full max-w-[min(65vw,260px)] overflow-hidden shadow-2xl md:max-w-[320px] ${
                !showArt ? "card-slot-empty" : ""
              }`}
            >
              {showArt && img ? (
                <Image
                  src={img}
                  alt={card.title || publicLabel(card)}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 65vw, 320px"
                  unoptimized={img.endsWith(".svg")}
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                  <span className="font-slot select-none text-[clamp(2.5rem,14vw,4rem)] leading-none text-ink-faint">
                    {publicLabel(card)}
                  </span>
                </div>
              )}
              {effectiveLe && status === "owned" && (
                <span className="absolute left-2 top-2 bg-gold px-2 py-0.5 text-[9px] font-bold uppercase text-[#1a1400]">
                  LE
                </span>
              )}
            </div>
          </div>

          {/* Info — direita / baixo compacto */}
          <div className="flex min-h-0 flex-1 flex-col justify-between border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] md:border-t-0 md:border-l md:px-10 md:py-12">
            <div className="min-h-0 space-y-2 md:space-y-4">
              <p className="font-mono text-[11px] tracking-widest text-mint">
                #{publicLabel(card)}
              </p>
              <h2
                id={titleId}
                className="font-display text-xl leading-tight text-ink md:text-3xl"
              >
                {showArt && card.title ? card.title : "—"}
              </h2>

              {showArt && card.subtitle && (
                <p className="line-clamp-1 text-sm text-ink-muted md:line-clamp-none">
                  {card.subtitle}
                </p>
              )}

              {showArt && card.description && (
                <p className="line-clamp-2 text-sm leading-snug text-ink-muted md:line-clamp-4 md:leading-relaxed">
                  {card.description}
                </p>
              )}

              {status === "live" && card.drop_ends_at && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-2.5 py-1 text-xs font-medium text-mint">
                    <Icon name="zap" size={12} />
                    {formatCountdown(card.drop_ends_at)}
                  </span>
                  {card.le_enabled && leRemaining(card) > 0 && (
                    <span className="text-xs text-gold">
                      LE {leRemaining(card)}/{card.le_quota}
                    </span>
                  )}
                </div>
              )}

              {status === "owned" && (
                <p className="text-sm text-mint">
                  No seu álbum
                  {effectiveLe && (
                    <span className="ml-2 text-gold">· Limited Edition</span>
                  )}
                </p>
              )}

              {status === "empty_slot" && (
                <p className="text-sm text-ink-muted">
                  Slot vazio — ainda não colado ou janela encerrada.
                </p>
              )}
            </div>

            <div className="mt-3 shrink-0 space-y-2 md:mt-8">
              {status === "live" && isLoggedIn && (
                <button
                  type="button"
                  disabled={claiming}
                  onClick={handleClaim}
                  className="glass-btn flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50"
                >
                  <Icon name="save" size={16} />
                  {claiming ? "Salvando…" : "Salvar"}
                </button>
              )}
              {status === "live" && !isLoggedIn && (
                <button
                  type="button"
                  onClick={onRequestLogin}
                  className="glass-btn flex w-full items-center justify-center gap-2 py-3"
                >
                  <Icon name="user" size={16} />
                  Entre para salvar
                </button>
              )}
              {status === "owned" && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="glass-btn-ghost flex w-full items-center justify-center gap-2 py-2.5"
                >
                  <Icon name="download" size={16} />
                  Baixar
                </button>
              )}

              {feedback && (
                <p
                  className={`text-center text-xs md:text-sm ${wonLe ? "text-gold" : "text-mint"}`}
                  role="status"
                >
                  {feedback}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
