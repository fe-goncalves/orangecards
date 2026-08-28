type Props = {
  owned: number;
  total: number;
};

export function ProgressBar({ owned, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((owned / total) * 100);
  const complete = total > 0 && owned === total;

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-2xl tracking-wide text-ink sm:text-3xl">
          {owned}
          <span className="text-ink-muted">/{total}</span>
          <span className="ml-2 font-sans text-sm font-normal normal-case tracking-normal text-ink-muted">
            cards
          </span>
        </p>
        {complete && (
          <span className="rounded-[var(--radius-sm)] bg-gradient-to-r from-mint to-gold px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#04140e]">
            Álbum completo
          </span>
        )}
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-[var(--radius-pill)] bg-line"
        role="progressbar"
        aria-valuenow={owned}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progresso do álbum"
      >
        <div
          className="h-full bg-gradient-to-r from-mint to-mint-dim transition-[width] duration-500 ease-[var(--ease-out)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
