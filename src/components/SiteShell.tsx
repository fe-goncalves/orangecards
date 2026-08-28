import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  right?: ReactNode;
};

export function SiteShell({ children, right }: Props) {
  return (
    <div className="ds-stage min-h-screen">
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-3 pb-8 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:px-5 sm:pt-6">
        {/* Header: Esquerda (Logo + Nome da Coleção Horizontal) | Direita (Perfil + Logout) */}
        <header className="mb-6 flex items-center justify-between gap-3 border-b border-white/[0.04] pb-4 sm:mb-8 sm:pb-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
          >
            <Image
              src="/brand/icon.svg"
              alt="Orange Cards"
              width={44}
              height={44}
              className="h-8 w-8 shrink-0 transition duration-300 hover:drop-shadow-[0_0_14px_var(--mint-glow)] sm:h-10 sm:w-10"
              priority
            />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8e9892] sm:text-[11px]">
                Orange Cards
              </span>
              <span
                className="text-sm font-bold uppercase tracking-wider text-ink sm:text-base"
                style={{
                  fontFamily: '"pacaembu", "Pacaembu", ui-sans-serif, system-ui, sans-serif',
                  letterSpacing: "0.08em",
                }}
              >
                Season <span className="text-mint">8</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">{right}</div>
        </header>

        <div className="animate-rise flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
