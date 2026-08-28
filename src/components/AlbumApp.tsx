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

  const isLoggedIn = !!user;

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

  // Deep link só se logado
  useEffect(() => {
    const code = searchParams.get("card") ?? initialCardCode;
    if (!code) return;
    if (!isLoggedIn) {
      // limpa ?card= para visitante
      const params = new URLSearchParams(searchParams.toString());
      if (params.has("card")) {
        params.delete("card");
        const q = params.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      }
      return;
    }
    setOpenCode(code);
  }, [searchParams, isLoggedIn, initialCardCode, pathname, router]);

  const claimedCount = Object.keys(claims).length;
  const totalSlots = cards.length;

  const statusOf = useCallback(
    (card: Card) =>
      getCardUiStatus(card, Boolean(claims[card.id]), isLoggedIn),
    [claims, isLoggedIn]
  );

  const openCard = useMemo(() => {
    if (!openCode || !isLoggedIn) return null;
    return (
      cards.find((c) => c.code === openCode || c.number === openCode) ?? null
    );
  }, [cards, openCode, isLoggedIn]);

  function setCardParam(code: string | null) {
    if (!isLoggedIn) return;
    setOpenCode(code);
    const params = new URLSearchParams(searchParams.toString());
    if (code) params.set("card", code);
    else params.delete("card");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  function handleClaimed(cardId: string, isLe: boolean) {
    setClaims((prev) => ({
      ...prev,
      [cardId]: { is_le: isLe, claimed_at: new Date().toISOString() },
    }));
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
      {demoMode && (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-mint/30 bg-mint/10 px-3 py-2.5 text-sm sm:mb-5">
          Modo demo — preencha{" "}
          <code className="text-mint">service_role</code> e{" "}
          <code className="text-mint">ADMIN_EMAILS</code> no{" "}
          <code className="text-mint">.env.local</code>.
        </div>
      )}

      {isLoggedIn && (
        <section className="mb-4 sm:mb-5" aria-label="Progresso">
          <ProgressBar owned={claimedCount} total={totalSlots} />
        </section>
      )}

      <main className="flex-1">
        <CardGrid
          cards={cards}
          statusOf={statusOf}
          claims={claims}
          isLoggedIn={isLoggedIn}
          onOpen={(code) => setCardParam(code)}
        />
      </main>

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
    </SiteShell>
  );
}
