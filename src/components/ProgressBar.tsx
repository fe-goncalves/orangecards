"use client";

import { useState } from "react";
import { Icon } from "./Icon";

type Props = {
  owned: number;
  total: number;
  shareUrl?: string | null;
  onShowCelebration?: () => void;
};

export function ProgressBar({
  owned,
  total,
  shareUrl,
  onShowCelebration,
}: Props) {
  const [copied, setCopied] = useState(false);
  const pct = total === 0 ? 0 : Math.round((owned / total) * 100);
  const complete = total > 0 && owned === total;

  function handleCopyShare() {
    if (!shareUrl || typeof window === "undefined") return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="w-full rounded-2xl border border-white/[0.06] bg-surface/30 p-4 backdrop-blur-md">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <p className="font-display text-2xl font-bold tracking-wide text-ink sm:text-3xl">
            {owned}
            <span className="text-ink-muted">/{total}</span>
          </p>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Cards Colecionados ({pct}%)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {shareUrl && (
            <button
              type="button"
              onClick={handleCopyShare}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-ink transition hover:border-mint/40 hover:bg-white/[0.08] hover:text-mint"
              title="Copiar link da sua coleção para compartilhar"
            >
              <Icon
                name={copied ? "check" : "share"}
                size={13}
                className={copied ? "text-mint" : ""}
              />
              <span>{copied ? "Link Copiado!" : "Compartilhar"}</span>
            </button>
          )}

          {complete ? (
            <button
              type="button"
              onClick={onShowCelebration}
              className="animate-gold-pulse flex items-center gap-1.5 rounded-full bg-gradient-to-r from-mint to-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#04140e] shadow-md transition hover:scale-105"
            >
              <Icon name="sparkles" size={14} />
              <span>Coleção Completa 100%!</span>
            </button>
          ) : (
            <span className="text-xs font-mono text-mint">
              {total - owned} restante{total - owned === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={owned}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progresso da coleção"
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
