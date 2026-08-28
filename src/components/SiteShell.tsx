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
        {/* Header Responsivo e Elegante */}
        <header className="mb-5 flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3.5 sm:mb-8 sm:gap-4 sm:pb-5">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
          >
            {/* Ícone da Marca */}
            <Image
              src="/brand/icon.svg"
              alt="Orange Cards Icon"
              width={38}
              height={38}
              className="h-8 w-8 shrink-0 transition duration-300 hover:drop-shadow-[0_0_12px_var(--mint-glow)] sm:h-9 sm:w-9"
              priority
            />

            {/* Wordmark Oficial em SVG + Season 8 com Fonte Noka */}
            <div className="flex flex-col justify-center">
              <Image
                src="/brand/wordmark.svg"
                alt="ORANGE CARDS"
                width={120}
                height={12}
                className="h-2.5 w-auto sm:h-3"
                priority
              />
              <div
                className="mt-0.5 text-[10px] uppercase tracking-[0.16em] sm:text-[11px]"
                style={{
                  fontFamily: 'Noka, "pacaembu", ui-sans-serif, system-ui, sans-serif',
                  fontWeight: 500,
                }}
              >
                <span className="text-ink/80">SEASON </span>
                <span className="font-bold text-mint">8</span>
              </div>
            </div>
          </Link>

          {/* Botões do lado direito (Perfil + Sair ou Entrar) */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{right}</div>
        </header>

        <div className="animate-rise flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
