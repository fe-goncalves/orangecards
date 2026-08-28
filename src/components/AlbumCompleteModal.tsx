"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { ModalPortal } from "./ModalPortal";
import { ConfettiCelebration } from "./ConfettiCelebration";

type Props = {
  total: number;
  open: boolean;
  onClose: () => void;
};

export function AlbumCompleteModal({ total, open, onClose }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
    }
  }, [open]);

  if (!open) return null;

  return (
    <ModalPortal>
      <ConfettiCelebration active={showConfetti} type="gold" count={70} />
      <div
        className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 p-4 backdrop-blur-lg"
        role="presentation"
        onClick={onClose}
      >
        <div
          className="glass-panel animate-card-reveal relative flex w-full max-w-md flex-col items-center rounded-3xl border border-gold/40 bg-surface/90 p-6 text-center shadow-[0_0_80px_rgba(212,175,55,0.25)] sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="glass-icon-btn absolute right-3 top-3 z-10"
            aria-label="Fechar"
          >
            <Icon name="close" size={16} />
          </button>

          {/* Troféu com anel dourado */}
          <div className="animate-gold-pulse relative mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-gradient-to-br from-gold/30 to-black text-gold">
            <Icon name="sparkles" size={40} />
          </div>

          <span className="rounded-full bg-gold/20 px-3 py-1 text-[11px] font-bold tracking-widest uppercase text-gold">
            Conquista Desbloqueada
          </span>

          <h2 className="font-display mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            ÁLBUM COMPLETO 100%!
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Parabéns! Você colecionou todos os <strong>{total} cards</strong> da temporada. Você é um Mestre Colecionador da Orange Cards Season 8!
          </p>

          <div className="my-5 w-full rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Status do Álbum</span>
              <span className="font-bold text-mint">100% Concluído</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full w-full bg-gradient-to-r from-mint to-gold" />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="glass-btn w-full py-3 text-sm font-semibold text-[#04140e]"
          >
            Ver Meu Álbum Completo
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
