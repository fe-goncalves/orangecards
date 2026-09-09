"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { GlassBackdrop } from "./GlassPanel";
import { Icon } from "./Icon";
import { ModalPortal } from "./ModalPortal";

const STORAGE_KEY = "oc.onboarding.v1";

const STEPS = [
  {
    title: "A COMUNIDADE VOTA",
    body: "Toda semana a torcida escolhe quem vira card — a votação rola no Instagram. E pode sair mais de um card na semana.",
  },
  {
    title: "O CARD É REVELADO",
    body: "A arte oficial entra na grade da Season 8 — numerada, com data e hora do drop. Além dos Matchweek, a coleção tem Legacy, Hero e outros tipos.",
  },
  {
    title: "O DROP ABRE",
    body: "Por tempo limitado, o pacotinho fica ativo no site. Quem não abrir dentro da janela perde a chance.",
  },
  {
    title: "VOCÊ ABRE E COLECIONA",
    body: "Clicou, abriu, o card é seu — direto na coleção. No abrir tem sorteio automático de Limited Edition, com arte exclusiva e cota limitada.",
  },
] as const;

type Props = {
  open: boolean;
  onDismiss: () => void;
  onCreateAccount: () => void;
};

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function OnboardingModal({ open, onDismiss, onCreateAccount }: Props) {
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        markOnboardingSeen();
        onDismiss();
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onDismiss]);

  useEffect(() => {
    if (!open) setStep(0);
  }, [open]);

  if (!open) return null;

  function goTo(next: number) {
    setStep(next);
    setAnimKey((k) => k + 1);
  }

  function dismiss() {
    markOnboardingSeen();
    onDismiss();
  }

  function createAccount() {
    markOnboardingSeen();
    onDismiss();
    onCreateAccount();
  }

  return (
    <ModalPortal>
      <GlassBackdrop onClose={dismiss}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="glass-panel modal-scroll relative mx-auto flex w-full max-h-[min(88dvh,720px)] max-w-md flex-col overflow-y-auto rounded-2xl px-5 pb-5 pt-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:px-7 sm:pb-7 sm:pt-8"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={dismiss}
            className="glass-icon-btn absolute right-3 top-3 z-10"
            aria-label="Fechar"
          >
            <Icon name="close" size={16} />
          </button>

          <div className="mb-6 flex flex-col items-center pr-6">
            <Image
              src="/brand/wordmark.svg"
              alt="ORANGE CARDS"
              width={160}
              height={16}
              className="h-3.5 w-auto sm:h-4"
              priority
            />
            <p
              id={titleId}
              className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ink-faint"
            >
              Season 8 · Como funciona
            </p>
          </div>

          <div
            key={animKey}
            className="animate-onboard-step flex flex-1 flex-col"
          >
            <div className="flex items-start gap-4">
              <span
                className="font-display select-none text-[3.25rem] font-bold leading-none text-mint sm:text-[3.75rem]"
                aria-hidden
              >
                {step + 1}
              </span>
              <div className="min-w-0 pt-1">
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-mint sm:text-lg">
                  {current.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
                  {current.body}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Passo ${i + 1}`}
                aria-current={i === step ? "step" : undefined}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-mint"
                    : "w-1.5 bg-white/20 hover:bg-white/35"
                }`}
              />
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="glass-btn-ghost flex-1 py-2.5 text-sm"
              >
                Voltar
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                className="glass-btn flex-[1.4] py-2.5 text-sm font-semibold"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={createAccount}
                className="glass-btn flex-[1.4] py-2.5 text-sm font-semibold"
              >
                Criar conta
              </button>
            )}
          </div>

          {isLast && (
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 w-full text-center text-xs text-ink-muted transition hover:text-mint"
            >
              Explorar o álbum
            </button>
          )}

          <div className="mt-6 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-5">
            <Image
              src="/brand/icon.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 opacity-80"
            />
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-ink-faint">
              <a
                href="https://instagram.com/copaorange"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-mint"
              >
                @copaorange
              </a>
              <span aria-hidden className="text-white/15">
                ·
              </span>
              <a
                href="https://copaorange.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-mint"
              >
                copaorange.com.br
              </a>
            </p>
          </div>
        </div>
      </GlassBackdrop>
    </ModalPortal>
  );
}
