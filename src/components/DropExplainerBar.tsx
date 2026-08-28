"use client";

import { Icon } from "./Icon";

export function DropExplainerBar() {
  return (
    <div className="mb-6 rounded-2xl border border-white/[0.08] bg-surface/40 p-3.5 backdrop-blur-md sm:mb-8 sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Item 1: Drops */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-mint/25 bg-mint/10 text-mint">
            <Icon name="zap" size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-ink">Drops Temporários</h4>
            <p className="text-[11px] leading-tight text-ink-muted">
              Cards liberados por tempo limitado na temporada.
            </p>
          </div>
        </div>

        {/* Item 2: Pacotinhos */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-ink">
            <Icon name="album" size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-ink">Abra o Pacotinho</h4>
            <p className="text-[11px] leading-tight text-ink-muted">
              Clique nos cards ativos para rasgar o pacote e colar.
            </p>
          </div>
        </div>

        {/* Item 3: Limited Edition */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
            <Icon name="sparkles" size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gold">Edições Raras (LE)</h4>
            <p className="text-[11px] leading-tight text-ink-muted">
              Sorteio automático de versões Limited Edition exclusivas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
