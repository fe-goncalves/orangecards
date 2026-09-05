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
  /** Contagem regressiva DD:HH:MM:SS (drops futuros) */
  countdown?: string | null;
  countdownLabel?: string;
};

export function TradingCardPack({
  cardNumber,
  isOpening = false,
  isInteractive = false,
  onClick,
  className = "",
  badgeLabel,
  countdown,
  countdownLabel = "Começa em",
}: Props) {
  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={`trading-pack-root group relative aspect-card w-full select-none overflow-hidden rounded-md ${
        isOpening ? "animate-pack-shake" : ""
      } ${
        isInteractive
          ? "cursor-pointer transition-transform duration-300 hover:scale-[1.025] hover:shadow-[0_12px_40px_rgba(0,255,171,0.25)]"
          : ""
      } ${className}`}
    >
      <div className="pack-green-body relative flex h-full w-full flex-col justify-between overflow-hidden text-center shadow-2xl">
        <div className="pack-crimp-emerald pack-crimp-top relative z-10 h-3.5 w-full shrink-0 border-b border-mint/20" />
        <div className="pack-green-foil-sheen pointer-events-none absolute inset-0 z-[2]" />

        <div className="pointer-events-none absolute inset-0 z-[1] opacity-25">
          <svg className="h-full w-full" viewBox="0 0 200 280" fill="none">
            <line x1="0" y1="50" x2="200" y2="190" stroke="#00FFAB" strokeWidth="0.75" />
            <line x1="0" y1="90" x2="200" y2="230" stroke="#00FFAB" strokeWidth="0.5" />
            <line x1="0" y1="20" x2="200" y2="160" stroke="#00FFAB" strokeWidth="0.5" />
            <circle cx="100" cy="140" r="70" stroke="#00FFAB" strokeWidth="0.5" strokeDasharray="4 4" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-2 py-2.5 sm:px-4 sm:py-3.5">
          <div className="flex flex-col items-center gap-1">
            <Image
              src="/brand/icon.svg"
              alt="Orange Cards"
              width={24}
              height={24}
              className="h-5 w-5 drop-shadow-[0_0_10px_rgba(0,255,171,0.6)] sm:h-7 sm:w-7"
            />
            <Image
              src="/brand/wordmark.svg"
              alt="ORANGE CARDS"
              width={80}
              height={9}
              className="h-2 w-auto opacity-95 sm:h-2.5"
            />
          </div>

          <div className="my-auto flex flex-col items-center">
            <span
              className="text-[9px] uppercase tracking-[0.18em] text-mint/80 sm:text-[11px]"
              style={{
                fontFamily: 'Noka, "pacaembu", ui-sans-serif, system-ui, sans-serif',
                fontWeight: 500,
              }}
            >
              SEASON <span className="font-bold text-white">8</span>
            </span>

            <div className="relative my-1 flex items-center justify-center sm:my-1.5">
              <span
                className="select-none text-2xl font-black tracking-tight text-white drop-shadow-[0_0_16px_rgba(0,255,171,0.5)] sm:text-4xl md:text-5xl"
                style={{
                  fontFamily: '"pacaembu", "Pacaembu", ui-sans-serif, system-ui, sans-serif',
                }}
              >
                #{cardNumber}
              </span>
            </div>

            {countdown ? (
              <div className="mt-0.5 flex flex-col items-center gap-0.5">
                <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-mint/70 sm:text-[9px]">
                  {countdownLabel}
                </span>
                <span className="font-mono text-[11px] font-bold tabular-nums tracking-wider text-white sm:text-xs">
                  {countdown}
                </span>
              </div>
            ) : badgeLabel ? (
              <span className="animate-badge-pulse inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#04140e] shadow-md sm:text-[9px]">
                <Icon name="sparkles" size={10} />
                {badgeLabel}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 opacity-60">
            <div className="h-0.5 w-4 bg-mint/40 sm:w-6" />
            <span className="text-[7px] font-bold uppercase tracking-[0.18em] text-mint sm:text-[8px]">
              BOOSTER PACK
            </span>
            <div className="h-0.5 w-4 bg-mint/40 sm:w-6" />
          </div>
        </div>

        <div className="pack-crimp-emerald pack-crimp-bottom relative z-10 h-3.5 w-full shrink-0 border-t border-mint/20" />
      </div>
    </div>
  );
}
