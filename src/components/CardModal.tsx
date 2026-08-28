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
import { ConfettiCelebration } from "./ConfettiCelebration";

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
  const [openingState, setOpeningState] = useState<"sealed" | "opening" | "revealed">("sealed");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wonLe, setWonLe] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isOwned = status === "owned";
  const isLive = status === "live";

  useEffect(() => {
    if (!card) return;
    setFeedback(null);
    setWonLe(false);
    setShowConfetti(false);
    setOpeningState(isOwned ? "revealed" : "sealed");
  }, [card?.id, isOwned]);

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
  const showArt = openingState === "revealed" || isOwned;
  const img = showArt
    ? resolveImageUrl(displayImagePath(card, effectiveLe))
    : "";
  void tick;

  async function handleOpenPack() {
    if (!card || !isLoggedIn || openingState === "opening") return;
    setOpeningState("opening");
    setFeedback(null);

    const supabase = createClient();
    
    // Aguarda o shake do pacote para criar tensão
    const [rpcResult] = await Promise.all([
      supabase.rpc("claim_card", { p_card_id: card.id }),
      new Promise((resolve) => setTimeout(resolve, 850)),
    ]);

    const { data, error } = rpcResult;

    if (error) {
      setOpeningState("sealed");
      setFeedback(error.message);
      return;
    }

    const result = data as ClaimResult;
    setFeedback(result.message);

    if (result.ok) {
      const isWinner = Boolean(result.is_le);
      if (isWinner) {
        setWonLe(true);
        setShowConfetti(true);
      }
      setOpeningState("revealed");
      onClaimed(card.id, isWinner);
    } else {
      setOpeningState("sealed");
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
      {showConfetti && <ConfettiCelebration active={showConfetti} type="gold" count={65} />}

      <div
        className="fixed inset-0 z-[200] flex bg-black"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative flex h-dvh w-full flex-col overflow-y-auto md:overflow-hidden md:flex-row md:items-stretch"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botão Fechar */}
          <button
            type="button"
            onClick={onClose}
            className="glass-icon-btn absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-30 md:right-5 md:top-5"
            aria-label="Fechar"
          >
            <Icon name="close" size={18} />
          </button>

          {/* Lado Esquerdo: Área Visual do Card / Pacotinho */}
          <div className="relative flex shrink-0 items-center justify-center overflow-hidden bg-[#070908] px-4 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-4 md:w-[min(48vw,440px)] md:flex-col md:px-8 md:py-10">
            {/* Raios Dourados de Fundo se for LE revelado */}
            {effectiveLe && showArt && (
              <div
                className="animate-le-rays pointer-events-none absolute -inset-24 z-0 opacity-40"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, rgba(212,175,55,0.4) 15deg, transparent 30deg, transparent 60deg, rgba(212,175,55,0.4) 75deg, transparent 90deg, transparent 120deg, rgba(212,175,55,0.4) 135deg, transparent 150deg, transparent 180deg, rgba(212,175,55,0.4) 195deg, transparent 210deg, transparent 240deg, rgba(212,175,55,0.4) 255deg, transparent 270deg, transparent 300deg, rgba(212,175,55,0.4) 315deg, transparent 330deg)",
                }}
              />
            )}

            {/* 1. ESTADO: PACOTE LACRADO (Drop ao vivo, pronto para abrir) */}
            {openingState !== "revealed" && isLive && (
              <div
                onClick={() => isLoggedIn && handleOpenPack()}
                className={`group relative aspect-card w-full max-w-[min(65vw,260px)] md:max-w-[300px] cursor-pointer select-none transition ${
                  openingState === "opening" ? "animate-pack-shake" : "hover:scale-[1.02]"
                }`}
              >
                <div className="pack-foil-card flex h-full w-full flex-col justify-between p-3 text-center">
                  <div className="pack-crimp-top -mx-3 -mt-3" />

                  <div className="flex items-center justify-between px-1 text-[10px] uppercase tracking-widest text-mint">
                    <span>Orange Cards</span>
                    <span>S8</span>
                  </div>

                  <div className="my-auto flex flex-col items-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-mint/40 bg-mint/10 text-mint drop-shadow-[0_0_12px_rgba(0,255,171,0.5)]">
                      <Icon name="sparkles" size={24} />
                    </div>
                    <span className="font-slot text-4xl text-ink drop-shadow-md">
                      #{publicLabel(card)}
                    </span>
                    <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-mint">
                      Booster Pack
                    </span>
                    <span className="mt-0.5 text-[9px] text-ink-muted">
                      Clique para rasgar e abrir
                    </span>
                  </div>

                  <div className="px-1 text-[9px] uppercase tracking-wider text-gold">
                    {card.le_enabled && leRemaining(card) > 0 ? "Chance de Limited Edition" : "Drop Oficial"}
                  </div>

                  <div className="pack-crimp-bottom -mx-3 -mb-3" />
                </div>
              </div>
            )}

            {/* 2. ESTADO: CARD REVELADO OU SLOT VAZIO */}
            {openingState === "revealed" && (
              <div
                className={`relative z-10 aspect-card w-full max-w-[min(65vw,260px)] overflow-hidden shadow-2xl md:max-w-[320px] ${
                  effectiveLe ? "animate-gold-pulse border-2 border-gold" : ""
                } ${!showArt ? "card-slot-empty" : "animate-card-reveal"}`}
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
                {effectiveLe && (
                  <span className="absolute left-2 top-2 z-10 rounded bg-gold px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#1a1400] shadow-md">
                    Limited Edition
                  </span>
                )}
              </div>
            )}

            {/* 3. ESTADO: SLOT VAZIO (Inativo / Fora da Janela) */}
            {!isLive && !isOwned && (
              <div className="card-slot-empty relative aspect-card w-full max-w-[min(65vw,260px)] overflow-hidden md:max-w-[320px]">
                <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                  <span className="font-slot select-none text-[clamp(2.5rem,14vw,4rem)] leading-none text-ink-faint">
                    {publicLabel(card)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lado Direito: Informações e Ações */}
          <div className="flex min-h-0 flex-1 flex-col justify-between border-t border-white/[0.06] bg-[#0a0a0a] px-5 py-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:border-t-0 md:border-l md:px-10 md:py-12">
            <div className="min-h-0 space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-widest text-mint">
                  #{publicLabel(card)}
                </span>
                {effectiveLe && (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                    ★ Limited Edition
                  </span>
                )}
              </div>

              <h2
                id={titleId}
                className="font-display text-2xl font-bold leading-tight text-ink md:text-3xl"
              >
                {showArt && card.title ? card.title : isLive ? "Pacotinho da Season 8" : "Card Não Revelado"}
              </h2>

              {showArt && card.subtitle && (
                <p className="text-sm font-medium text-mint">
                  {card.subtitle}
                </p>
              )}

              {showArt && card.description && (
                <p className="text-sm leading-relaxed text-ink-muted">
                  {card.description}
                </p>
              )}

              {/* Status do Drop */}
              {isLive && card.drop_ends_at && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-mint">
                    <Icon name="zap" size={13} />
                    Janela Encerra em: {formatCountdown(card.drop_ends_at)}
                  </span>
                  {card.le_enabled && leRemaining(card) > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                      <Icon name="sparkles" size={13} />
                      LE {leRemaining(card)}/{card.le_quota} disponíveis
                    </span>
                  )}
                </div>
              )}

              {/* Feedback de Colecionado */}
              {isOwned && (
                <div className="rounded-xl border border-mint/20 bg-mint/5 p-3">
                  <p className="text-xs font-semibold text-mint flex items-center gap-1.5">
                    <Icon name="check" size={14} />
                    Card Colado no seu Álbum
                  </p>
                  {effectiveLe && (
                    <p className="mt-1 text-[11px] text-gold">
                      Você conquistou uma das poucas cópias Limited Edition raras!
                    </p>
                  )}
                </div>
              )}

              {status === "empty_slot" && (
                <p className="text-xs leading-relaxed text-ink-muted">
                  Este card não possui janela de drop ativa no momento ou o período de resgate foi encerrado.
                </p>
              )}
            </div>

            {/* Ações Inferiores */}
            <div className="mt-5 shrink-0 space-y-2 md:mt-8">
              {/* Botão para Abrir Pacotinho */}
              {isLive && openingState !== "revealed" && isLoggedIn && (
                <button
                  type="button"
                  disabled={openingState === "opening"}
                  onClick={handleOpenPack}
                  className="glass-btn flex w-full items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-lg disabled:opacity-50"
                >
                  <Icon name="sparkles" size={18} />
                  {openingState === "opening" ? "Abrindo Pacotinho…" : "Rasgar e Abrir Pacotinho"}
                </button>
              )}

              {/* Convidar Visitante a Entrar */}
              {isLive && !isLoggedIn && (
                <button
                  type="button"
                  onClick={onRequestLogin}
                  className="glass-btn flex w-full items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-lg"
                >
                  <Icon name="user" size={18} />
                  Entre para Abrir o Pacotinho
                </button>
              )}

              {/* Botão de Baixar Card já Aberto */}
              {showArt && isOwned && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="glass-btn-ghost flex-1 items-center justify-center gap-2 py-3 text-sm font-medium"
                  >
                    <Icon name="download" size={16} />
                    Baixar Card em HD
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="glass-btn flex-1 items-center justify-center py-3 text-sm font-semibold"
                  >
                    Voltar ao Álbum
                  </button>
                </div>
              )}

              {feedback && (
                <p
                  className={`text-center text-xs font-semibold md:text-sm ${
                    wonLe ? "text-gold" : "text-mint"
                  }`}
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
