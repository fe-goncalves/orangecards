import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  right?: ReactNode;
};

/** Inline SVG so Noka (página) aplica no texto SEASON 8 */
function SeasonBadge() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 36"
      className="h-5 w-auto sm:h-6"
      role="img"
      aria-label="Season 8"
    >
      <text
        x="110"
        y="28"
        textAnchor="middle"
        style={{
          fontFamily: "Pacaembu, Noka, var(--font-sans-fallback), ui-sans-serif, system-ui, sans-serif",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "0.14em",
        }}
      >
        <tspan fill="#f4f7f5">SEASON </tspan>
        <tspan fill="#00FFAB" style={{ fontWeight: 700, letterSpacing: "0.02em" }}>
          8
        </tspan>
      </text>
    </svg>
  );
}

export function SiteShell({ children, right }: Props) {
  return (
    <div className="ds-stage min-h-screen">
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-3 pb-8 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:px-5 sm:pt-6">
        <header className="relative mb-6 flex min-h-[4.25rem] items-start justify-end sm:mb-8 sm:min-h-[5.25rem]">
          <Link
            href="/"
            className="absolute left-1/2 top-0 z-[1] flex -translate-x-1/2 flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
          >
            <Image
              src="/brand/icon.svg"
              alt=""
              width={56}
              height={56}
              className="h-10 w-10 shrink-0 transition duration-300 hover:drop-shadow-[0_0_14px_var(--mint-glow)] sm:h-14 sm:w-14"
              priority
            />
            <span className="sr-only">ORANGE CARDS</span>
            <SeasonBadge />
          </Link>
          <div className="relative z-[1] pt-0.5">{right}</div>
        </header>
        <div className="animate-rise flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
