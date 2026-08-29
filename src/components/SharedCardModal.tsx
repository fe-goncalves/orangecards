"use client";

import { useEffect, useState, useId } from "react";
import Image from "next/image";
import type { Card } from "@/lib/types";
import { displayImagePath, publicLabel, resolveImageUrl } from "@/lib/cards";
import { EaFcStage } from "./EaFcStage";
import { Icon } from "./Icon";
import { ModalPortal } from "./ModalPortal";

type Props = {
  card: Card | null;
  isLe?: boolean;
  isOwned?: boolean;
  onClose: () => void;
};

export function SharedCardModal({
  card,
  isLe = false,
  isOwned = false,
  onClose,
}: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const titleId = useId();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!card) return null;

  const currentImg = resolveImageUrl(
    isFlipped ? card.image_path : displayImagePath(card, isLe)
  );
  const regularImg = resolveImageUrl(card.image_path);

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[200] flex bg-black/90 backdrop-blur-md"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative flex h-dvh w-full flex-col overflow-x-hidden overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-row md:items-stretch md:overflow-hidden"
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

          {/* Lado Esquerdo: Visual do Card */}
          <div className="relative flex shrink-0 items-center justify-center overflow-hidden bg-transparent px-4 pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-4 sm:px-6 sm:py-6 md:w-[min(48vw,460px)] md:flex-col md:px-8 md:py-10">
            {isLe && isOwned ? (
              <EaFcStage active={true} isWalkout={false}>
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => setIsFlipped((f) => !f)}
                    className="group relative aspect-card w-[min(78vw,315px)] cursor-pointer transition-transform duration-500 [transform-style:preserve-3d] hover:scale-[1.02] sm:w-[330px] md:w-[350px]"
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
                          sizes="(max-width:768px) 78vw, 350px"
                          unoptimized={currentImg.endsWith(".svg")}
                          priority
                        />
                      )}

                      {!isFlipped && (
                        <>
                          <div className="eafc-holo-sheen" />
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
            ) : isOwned ? (
              <div className="relative z-10 aspect-card w-[min(78vw,315px)] overflow-hidden rounded-md border border-white/15 shadow-2xl sm:w-[330px] md:w-[350px]">
                {regularImg ? (
                  <Image
                    src={regularImg}
                    alt={card.title || publicLabel(card)}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 78vw, 350px"
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
            ) : (
              <div className="card-slot-empty relative aspect-card w-[min(78vw,315px)] overflow-hidden rounded-md sm:w-[330px] md:w-[350px]">
                <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                  <span className="font-slot select-none text-[clamp(2.5rem,14vw,4rem)] leading-none text-ink-faint">
                    #{publicLabel(card)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lado Direito: Informações */}
          <div
            className={`flex flex-col shrink-0 gap-4 px-4 pt-2 pb-[max(2.5rem,env(safe-area-inset-bottom,20px))] sm:px-6 sm:py-6 md:min-h-0 md:flex-1 md:shrink md:justify-between md:gap-0 md:border-l md:px-10 md:py-10 md:pb-10 ${
              isLe && isOwned
                ? "border-gold/20 bg-gradient-to-b from-[#11120e]/60 via-[#090a09] to-[#050605]"
                : "border-white/[0.06] bg-[#0a0a0a]"
            }`}
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-widest text-mint">
                  #{publicLabel(card)}
                </span>
                {isLe && isOwned && (
                  <span className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-gold shadow-sm">
                    <Icon name="sparkles" size={11} />
                    ★ Limited Edition
                  </span>
                )}
                {!isOwned && (
                  <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
                    Não Conquistado
                  </span>
                )}
              </div>

              <h2
                id={titleId}
                className={`font-display text-xl font-bold leading-tight sm:text-2xl md:text-3xl ${
                  isLe && isOwned ? "text-[#fbf2d8]" : "text-ink"
                }`}
              >
                {card.title || `Card #${publicLabel(card)}`}
              </h2>

              {card.subtitle && (
                <p
                  className={`text-xs font-medium sm:text-sm ${
                    isLe && isOwned ? "text-[#e8cf78]" : "text-mint"
                  }`}
                >
                  {card.subtitle}
                </p>
              )}

              {card.description && (
                <p className="text-xs leading-relaxed text-ink-muted sm:text-sm">
                  {card.description}
                </p>
              )}

              {/* Status do Colecionador */}
              {isOwned ? (
                <div
                  className={`rounded-xl border p-3 ${
                    isLe
                      ? "border-gold/30 bg-gold/10"
                      : "border-mint/20 bg-mint/5"
                  }`}
                >
                  <p
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      isLe ? "text-gold" : "text-mint"
                    }`}
                  >
                    <Icon name="check" size={14} />
                    {isLe
                      ? "O colecionador possui a Edição Limitada deste card!"
                      : "Card presente nesta coleção"}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-surface-2/40 p-3 text-xs text-ink-muted">
                  O colecionador ainda não conquistou este card na Season 8.
                </div>
              )}
            </div>

            {/* Ação: Fechar */}
            <div className="mt-4 shrink-0 border-t border-white/[0.06] pt-3 sm:mt-6 sm:border-t-0 sm:pt-0">
              <button
                type="button"
                onClick={onClose}
                className="glass-btn flex w-full items-center justify-center py-3 text-xs font-semibold active:scale-[0.98] sm:text-sm"
              >
                Voltar à Coleção
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
