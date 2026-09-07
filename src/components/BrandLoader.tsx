"use client";

import Image from "next/image";

type Props = {
  label?: string;
  fullScreen?: boolean;
};

/** Loading de marca — logo + wordmark com pulse suave. */
export function BrandLoader({
  label = "Carregando…",
  fullScreen = true,
}: Props) {
  const inner = (
    <div className="flex flex-col items-center gap-5 animate-rise">
      <div className="relative flex h-16 w-16 items-center justify-center sm:h-[4.5rem] sm:w-[4.5rem]">
        <span
          className="absolute inset-0 rounded-2xl bg-mint/10 animate-brand-breathe"
          aria-hidden
        />
        <Image
          src="/brand/icon.svg"
          alt=""
          width={48}
          height={48}
          className="relative h-10 w-10 sm:h-12 sm:w-12 animate-brand-logo"
          priority
        />
      </div>
      <Image
        src="/brand/wordmark.svg"
        alt="ORANGE CARDS"
        width={140}
        height={14}
        className="h-3 w-auto opacity-90"
        priority
      />
      <p className="text-[11px] tracking-[0.18em] uppercase text-ink-faint">
        {label}
      </p>
    </div>
  );

  if (!fullScreen) return inner;

  return (
    <div
      className="ds-stage flex min-h-screen items-center justify-center px-6"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {inner}
    </div>
  );
}
