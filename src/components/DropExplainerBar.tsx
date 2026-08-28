"use client";

import { Icon } from "./Icon";

export function DropExplainerBar() {
  return (
    <div className="mb-5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 backdrop-blur-sm sm:mb-7 sm:p-3.5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
        {/* Item 1: Drops */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-mint/20 bg-mint/5 text-mint/80">
            <Icon name="zap" size={14} />
          </div>
          <div>
            <h4 className="text-[11px] font-medium tracking-wide text-ink/90 sm:text-xs">Drops Temporários</h4>
            <p className="text-[10px] font-normal leading-normal text-ink-muted/70 sm:text-[11px]">
              Cards liberados por tempo limitado na temporada.
            </p>
          </div>
        </div>

        {/* Item 2: Pacotinhos */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-ink/70">
            <Icon name="album" size={14} />
          </div>
          <div>
            <h4 className="text-[11px] font-medium tracking-wide text-ink/90 sm:text-xs">Abra o Pacotinho</h4>
            <p className="text-[10px] font-normal leading-normal text-ink-muted/70 sm:text-[11px]">
              Clique nos cards ativos para rasgar o pacote e colar.
            </p>
          </div>
        </div>

        {/* Item 3: Limited Edition */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/5 text-gold/80">
            <Icon name="sparkles" size={14} />
          </div>
          <div>
            <h4 className="text-[11px] font-medium tracking-wide text-gold/90 sm:text-xs">Edições Raras (LE)</h4>
            <p className="text-[10px] font-normal leading-normal text-ink-muted/70 sm:text-[11px]">
              Sorteio automático de versões Limited Edition exclusivas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
