"use client";

import Image from "next/image";
import { Icon } from "./Icon";

type Props = {
  cardNumber: string;
  isOpening?: boolean;
  isInteractive?: boolean;
  onClick?: () => void;
  className?: string;
  badgeLabel?: string;
};

export function TradingCardPack({
  cardNumber,
  isOpening = false,
  isInteractive = false,
  onClick,
  className = "",
  badgeLabel,
}: Props) {
  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={`trading-pack-root group relative aspect-card w-full select-none overflow-hidden rounded-md ${
        isOpening ? "animate-pack-shake" : ""
      } ${
        isInteractive
          ? "cursor-pointer transition-transform duration-300 hover:scale-[1.025] hover:shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
          : ""
      } ${className}`}
    >
      {/* Corpo Metálico do Pacotinho Estilo Foil Pillow */}
      <div className="trading-pack-body relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0c0e0d] text-center shadow-2xl">
        {/* Selo Serrilhado Superior (Crimp Seal) */}
        <div className="trading-pack-crimp trading-pack-crimp-top relative z-10 h-4 w-full shrink-0 border-b border-white/[0.08]" />

        {/* Reflexo de Luz Metálica (Foil Sheen) */}
        <div className="trading-pack-foil-highlight pointer-events-none absolute inset-0 z-[2]" />

        {/* Conteúdo Gráfico Frontal do Pack */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          {/* Header Superior */}
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1.5 text-left">
              <Image
                src="/brand/icon.svg"
                alt=""
                width={16}
                height={16}
                className="h-3.5 w-3.5 opacity-85 brightness-125"
              />
              <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#d6cbb6] sm:text-[9px]">
                Orange Cards
              </span>
            </div>
            <span className="text-[7px] font-semibold uppercase tracking-wider text-[#9ea39f] sm:text-[8px]">
              Season 8
            </span>
          </div>

          {/* Centro do Pacotinho */}
          <div className="my-auto flex flex-col items-center">
            <div className="mb-1 flex items-center justify-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#c7b99c] opacity-90 sm:text-[10px]">
                Trading Card
              </span>
            </div>

            <h3
              className="text-lg font-black uppercase tracking-tight text-[#f3ece0] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-2xl"
              style={{
                fontFamily: '"pacaembu", "Pacaembu", ui-sans-serif, system-ui, sans-serif',
                lineHeight: 1.05,
              }}
            >
              Card Pack
            </h3>

            {/* Número do Card em Destaque Dourado/Areia */}
            <div className="mt-2.5 flex items-center justify-center">
              <span className="rounded-md border border-[#d6cbb6]/25 bg-black/45 px-2.5 py-0.5 text-xs font-black tracking-widest text-[#f5ebd9] shadow-inner sm:text-sm">
                #{cardNumber}
              </span>
            </div>

            {badgeLabel && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-mint">
                <Icon name="sparkles" size={9} />
                {badgeLabel}
              </span>
            )}
          </div>

          {/* Rodapé do Pack */}
          <div className="w-full border-t border-white/[0.06] pt-1 text-center">
            <p className="text-[7px] uppercase tracking-[0.18em] text-[#8e9690] sm:text-[8px]">
              Limited Drop Edition
            </p>
          </div>
        </div>

        {/* Selo Serrilhado Inferior (Crimp Seal) */}
        <div className="trading-pack-crimp trading-pack-crimp-bottom relative z-10 h-4 w-full shrink-0 border-t border-white/[0.08]" />
      </div>
    </div>
  );
}
