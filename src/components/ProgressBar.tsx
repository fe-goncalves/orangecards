"use client";

import { Icon } from "./Icon";

type Props = {
  owned: number;
  total: number;
  onShowCelebration?: () => void;
};

export function ProgressBar({ owned, total, onShowCelebration }: Props) {
  const pct = total === 0 ? 0 : Math.round((owned / total) * 100);
  const complete = total > 0 && owned === total;

  return (
    <div className="w-full rounded-2xl border border-white/[0.06] bg-surface/30 p-4 backdrop-blur-md">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <p className="font-display text-2xl font-bold tracking-wide text-ink sm:text-3xl">
            {owned}
            <span className="text-ink-muted">/{total}</span>
          </p>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Cards Colecionados ({pct}%)
          </span>
        </div>

        {complete ? (
          <button
            type="button"
            onClick={onShowCelebration}
            className="animate-gold-pulse flex items-center gap-1.5 rounded-full bg-gradient-to-r from-mint to-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#04140e] shadow-md transition hover:scale-105"
          >
            <Icon name="sparkles" size={14} />
            <span>Álbum Completo 100%!</span>
          </button>
        ) : (
          <span className="text-xs font-mono text-mint">
            {total - owned} restante{total - owned === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={owned}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progresso do álbum"
      >
        <div
          className={`h-full transition-all duration-700 ease-out ${
            complete
              ? "bg-gradient-to-r from-mint via-[#b2f5d9] to-gold shadow-[0_0_12px_rgba(212,175,55,0.6)]"
              : "bg-gradient-to-r from-mint to-mint-dim"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
