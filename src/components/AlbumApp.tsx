"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Card, ClaimMap, Collection } from "@/lib/types";
import { getCardUiStatus } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { AuthButton } from "./AuthButton";
import { ProgressBar } from "./ProgressBar";
import { CardGrid } from "./CardGrid";
import { CardModal } from "./CardModal";
import { SiteShell } from "./SiteShell";
import { DropExplainerBar } from "./DropExplainerBar";
import { AlbumCompleteModal } from "./AlbumCompleteModal";
import { Icon } from "./Icon";

type Props = {
  collection: Collection | null;
  cards: Card[];
  initialClaims: ClaimMap;
  initialUser: User | null;
  initialCardCode: string | null;
  demoMode?: boolean;
};

export function AlbumApp({
  collection,
  cards,
  initialClaims,
  initialUser,
  initialCardCode,
  demoMode = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(initialUser);
  const [claims, setClaims] = useState<ClaimMap>(initialClaims);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [loginNudge, setLoginNudge] = useState(0);
  const [authBanner, setAuthBanner] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const isLoggedIn = !!user;

  // Supabase Auth State Listener
  useEffect(() => {
    if (demoMode) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [demoMode]);

  // Tratamento de verificação de e-mail / ?code= ou ?auth=verified
  useEffect(() => {
    const code = searchParams.get("code");
    const authStatus = searchParams.get("auth");

    if (code) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (!error && data.user) {
          setUser(data.user);
          setAuthBanner("E-mail verificado com sucesso! Sua conta está ativa.");
        }
        // Limpa parâmetro da URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete("code");
        const q = params.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      });
    } else if (authStatus === "verified") {
      setAuthBanner("E-mail verificado com sucesso! Bem-vindo à Orange Cards.");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("auth");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  // Deep link de cards
  useEffect(() => {
    const code = searchParams.get("card") ?? initialCardCode;
    if (!code) return;
    setOpenCode(code);
  }, [searchParams, initialCardCode]);

  const claimedCount = Object.keys(claims).length;
  const totalSlots = cards.length;
  const isComplete = totalSlots > 0 && claimedCount === totalSlots;

  const userNick = (user?.user_metadata?.nickname as string)?.trim();
  const shareIdentifier = userNick || user?.id;
  const shareUrl =
    user && shareIdentifier
      ? typeof window !== "undefined"
        ? `${window.location.origin}/u/${encodeURIComponent(shareIdentifier)}`
        : `https://cards.copaorange.com.br/u/${encodeURIComponent(shareIdentifier)}`
      : null;

  const statusOf = useCallback(
    (card: Card) =>
      getCardUiStatus(card, Boolean(claims[card.id]), isLoggedIn),
    [claims, isLoggedIn]
  );

  const openCard = useMemo(() => {
    if (!openCode) return null;
    return (
      cards.find((c) => c.code === openCode || c.number === openCode) ?? null
    );
  }, [cards, openCode]);

  function setCardParam(code: string | null) {
    setOpenCode(code);
    const params = new URLSearchParams(searchParams.toString());
    if (code) params.set("card", code);
    else params.delete("card");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  function handleClaimed(cardId: string, isLe: boolean) {
    setClaims((prev) => {
      const next = {
        ...prev,
        [cardId]: { is_le: isLe, claimed_at: new Date().toISOString() },
      };
      if (totalSlots > 0 && Object.keys(next).length === totalSlots) {
        setShowCelebration(true);
      }
      return next;
    });
  }

  return (
    <SiteShell
      right={
        <AuthButton
          initialUser={user}
          openSignal={loginNudge}
          disabled={demoMode}
        />
      }
    >
      {/* Banner de Boas-Vindas / Confirmação de E-mail */}
      {authBanner && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-mint/30 bg-mint/10 px-4 py-3 text-xs font-semibold text-mint sm:mb-6">
          <div className="flex items-center gap-2">
            <Icon name="check" size={16} />
            <span>{authBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setAuthBanner(null)}
            className="text-ink-muted hover:text-ink"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {demoMode && (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-mint/30 bg-mint/10 px-3 py-2.5 text-sm sm:mb-5">
          Modo demo — preencha{" "}
          <code className="text-mint">service_role</code> e{" "}
          <code className="text-mint">ADMIN_EMAILS</code> no{" "}
          <code className="text-mint">.env.local</code>.
        </div>
      )}

      {/* Disclaimers Visuais e Curtos */}
      <DropExplainerBar />

      {/* Barra de Progresso */}
      {isLoggedIn && (
        <section className="mb-6 sm:mb-8" aria-label="Progresso">
          <ProgressBar
            owned={claimedCount}
            total={totalSlots}
            shareUrl={shareUrl}
            onShowCelebration={() => setShowCelebration(true)}
          />
        </section>
      )}

      {/* Grade de Cards do Álbum */}
      <main className="flex-1">
        <CardGrid
          cards={cards}
          statusOf={statusOf}
          claims={claims}
          isLoggedIn={isLoggedIn}
          onOpen={(code) => setCardParam(code)}
        />
      </main>

      {/* Modal de Abertura de Pacotinho e Detalhes do Card */}
      <CardModal
        card={openCard}
        status={openCard ? statusOf(openCard) : null}
        isLoggedIn={isLoggedIn}
        isLe={openCard ? Boolean(claims[openCard.id]?.is_le) : false}
        onClose={() => setCardParam(null)}
        onClaimed={handleClaimed}
        onRequestLogin={() => {
          setCardParam(null);
          setLoginNudge((n) => n + 1);
        }}
      />

      {/* Modal de Álbum Completo */}
      {isComplete && (
        <AlbumCompleteModal
          total={totalSlots}
          open={showCelebration}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </SiteShell>
  );
}
