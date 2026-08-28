"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import type { Card, CardUiStatus, ClaimResult } from "@/lib/types";
import {
  displayImagePath,
  downloadCardImage,
  formatCountdown,
  publicLabel,
  resolveImageUrl,
} from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "./Icon";
import { ModalPortal } from "./ModalPortal";
import { ConfettiCelebration } from "./ConfettiCelebration";
import { EaFcStage } from "./EaFcStage";
import { TradingCardPack } from "./TradingCardPack";

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
  const [isWalkout, setIsWalkout] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isOwned = status === "owned";
  const isLive = status === "live";

  useEffect(() => {
    if (!card) return;
    setFeedback(null);
    setWonLe(false);
    setIsWalkout(false);
    setIsFlipped(false);
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

  const regularImg = showArt ? resolveImageUrl(card.image_path) : "";
  const leImg = showArt ? resolveImageUrl(card.le_image_path || card.image_path) : "";
  const currentImg = isFlipped ? regularImg : leImg;

  void tick;

  async function handleOpenPack() {
    if (!card || !isLoggedIn || openingState === "opening") return;
    setOpeningState("opening");
    setFeedback(null);

    const supabase = createClient();
    
    // Animação de tensão do pacote
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
        setIsWalkout(true);
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
    const path = isFlipped ? card.image_path : displayImagePath(card, effectiveLe);
    const label = publicLabel(card);
    await downloadCardImage(
      path,
      effectiveLe && !isFlipped ? `${label}-LE.png` : `${label}.png`
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

          {/* Lado Esquerdo: Visual do Card / Pacotinho */}
          <div className="relative flex shrink-0 items-center justify-center bg-transparent px-3 pt-[calc(2rem+env(safe-area-inset-top,0px))] pb-2 sm:px-6 sm:py-6 md:w-[min(48vw,440px)] md:flex-col md:px-8 md:py-10">
            {/* 1. SE FOR LIMITED EDITION (LE): Ativa Palco EA FC + Interação de Flip para ver versão Regular */}
            {effectiveLe && showArt ? (
              <EaFcStage active={true} isWalkout={isWalkout}>
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => setIsFlipped((f) => !f)}
                    className="group relative aspect-card w-[min(78vw,290px)] cursor-pointer transition-transform duration-500 [transform-style:preserve-3d] hover:scale-[1.02] sm:w-[310px] md:w-[330px]"
                    title="Clique para alternar versão Regular / LE"
                  >
                    <div
                      className={`relative h-full w-full overflow-hidden rounded-md transition-all duration-700 ${
                        isFlipped
                          ? "border border-white/20 bg-surface-2 shadow-2xl"
                          : "eafc-gold-bezel shadow-[0_20px_60px_rgba(212,175,55,0.4)]"
                      }`}
                    >
                      {currentImg && (
                        <Image
                          src={currentImg}
                          alt={card.title || publicLabel(card)}
                          fill
                          className="object-cover"
                          sizes="(max-width:768px) 78vw, 330px"
                          unoptimized={currentImg.endsWith(".svg")}
                          priority
                        />
                      )}

                      {!isFlipped && (
                        <>
                          {/* Sheen Holográfico Prismático */}
                          <div className="eafc-holo-sheen" />

                          {/* Badge EA FC Limited Edition */}
                          <div className="absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[#FFF0A5] via-[#D4AF37] to-[#8A6D1C] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#1a1400] shadow-[0_3px_10px_rgba(0,0,0,0.7)]">
                            <Icon name="sparkles" size={11} />
                            <span>Limited Edition</span>
                          </div>
                        </>
                      )}

                      {isFlipped && (
                        <div className="absolute left-2.5 top-2.5 z-20 flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-muted">
                          <span>Versão Regular</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dica de flip interativo */}
                  <button
                    type="button"
                    onClick={() => setIsFlipped((f) => !f)}
                    className="mt-3 flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-[11px] font-medium text-gold/90 transition hover:bg-gold/20 hover:text-gold"
                  >
                    <Icon name="sparkles" size={12} />
                    <span>
                      {isFlipped
                        ? "Ver versão Limited Edition"
                        : "Toque no card para ver versão Regular"}
                    </span>
                  </button>
                </div>
              </EaFcStage>
            ) : (
              <>
                {/* 2. ESTADO: PACOTE LACRADO (Drop ao vivo pronto para abrir) */}
                {openingState !== "revealed" && isLive && (
                  <div className="w-[min(78vw,290px)] sm:w-[300px] md:w-[320px]">
                    <TradingCardPack
                      cardNumber={publicLabel(card)}
                      isOpening={openingState === "opening"}
                      isInteractive={isLoggedIn}
                      onClick={handleOpenPack}
                      badgeLabel="Clique para Rasgar"
                    />
                  </div>
                )}

                {/* 3. ESTADO: CARD PADRÃO REVELADO */}
                {openingState === "revealed" && showArt && (
                  <div className="animate-card-reveal relative z-10 aspect-card w-[min(78vw,290px)] overflow-hidden rounded-md border border-white/10 shadow-2xl sm:w-[310px] md:w-[330px]">
                    {regularImg ? (
                      <Image
                        src={regularImg}
                        alt={card.title || publicLabel(card)}
                        fill
                        className="object-cover"
                        sizes="(max-width:768px) 78vw, 330px"
                        unoptimized={regularImg.endsWith(".svg")}
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                        <span className="font-slot select-none text-[clamp(2.5rem,14vw,4rem)] leading-none text-ink-faint">
                          #{publicLabel(card)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. ESTADO: SLOT VAZIO (Inativo / Fora da Janela) */}
                {!isLive && !isOwned && (
                  <div className="card-slot-empty relative aspect-card w-[min(78vw,290px)] overflow-hidden rounded-md sm:w-[310px] md:w-[330px]">
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                      <span className="font-slot select-none text-[clamp(2.5rem,14vw,4rem)] leading-none text-ink-faint">
                        #{publicLabel(card)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Lado Direito: Informações e Ações com visual adaptativo para LE */}
          <div
            className={`flex min-h-0 flex-1 flex-col justify-between px-4 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-6 md:border-l md:px-10 md:py-10 ${
              effectiveLe
                ? "border-gold/20 bg-gradient-to-b from-[#11120e]/60 via-[#090a09] to-[#050605]"
                : "border-white/[0.06] bg-[#0a0a0a]"
            }`}
          >
            <div className="min-h-0 space-y-2.5 sm:space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-widest text-mint">
                  #{publicLabel(card)}
                </span>
                {effectiveLe && (
                  <span className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-gold shadow-sm">
                    <Icon name="sparkles" size={11} />
                    ★ Limited Edition
                  </span>
                )}
              </div>

              <h2
                id={titleId}
                className={`font-display text-xl font-bold leading-tight sm:text-2xl md:text-3xl ${
                  effectiveLe ? "text-[#fbf2d8]" : "text-ink"
                }`}
              >
                {showArt && card.title
                  ? card.title
                  : isLive
                    ? "Pacotinho Trading Cards S8"
                    : "Card Não Revelado"}
              </h2>

              {showArt && card.subtitle && (
                <p className={`text-xs font-medium sm:text-sm ${effectiveLe ? "text-[#e8cf78]" : "text-mint"}`}>
                  {card.subtitle}
                </p>
              )}

              {showArt && card.description && (
                <p className="text-xs leading-relaxed text-ink-muted sm:text-sm">
                  {card.description}
                </p>
              )}

              {/* Status do Drop */}
              {isLive && card.drop_ends_at && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-[11px] font-semibold text-mint sm:text-xs">
                    <Icon name="zap" size={12} />
                    Janela Encerra em: {formatCountdown(card.drop_ends_at)}
                  </span>
                  {card.le_enabled && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold text-gold sm:text-xs">
                      <Icon name="sparkles" size={12} />
                      Edição Limitada Disponível
                    </span>
                  )}
                </div>
              )}

              {/* Feedback de Colecionado */}
              {isOwned && (
                <div
                  className={`rounded-xl border p-3 ${
                    effectiveLe
                      ? "border-gold/30 bg-gold/10"
                      : "border-mint/20 bg-mint/5"
                  }`}
                >
                  <p
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      effectiveLe ? "text-gold" : "text-mint"
                    }`}
                  >
                    <Icon name="check" size={14} />
                    Card Colecionado na sua Coleção
                  </p>
                  {effectiveLe && (
                    <p className="mt-1 text-[11px] text-[#eedba0]">
                      Você conquistou uma cópia Limited Edition exclusiva desta temporada!
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
            <div className="mt-4 shrink-0 space-y-2 sm:mt-6">
              {/* Botão para Abrir Pacotinho */}
              {isLive && openingState !== "revealed" && isLoggedIn && (
                <button
                  type="button"
                  disabled={openingState === "opening"}
                  onClick={handleOpenPack}
                  className="glass-btn flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg disabled:opacity-50 sm:py-3.5"
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
                  className="glass-btn flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg sm:py-3.5"
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
                    className="glass-btn-ghost flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium sm:gap-2 sm:py-3 sm:text-sm"
                  >
                    <Icon name="download" size={15} />
                    Baixar Card em HD
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="glass-btn flex-1 items-center justify-center py-2.5 text-xs font-semibold sm:py-3 sm:text-sm"
                  >
                    Voltar à Coleção
                  </button>
                </div>
              )}

              {feedback && (
                <p
                  className={`text-center text-xs font-semibold ${
                    feedback.includes("Parabéns") || feedback.includes("sucesso")
                      ? "text-mint"
                      : "text-ink-muted"
                  }`}
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
