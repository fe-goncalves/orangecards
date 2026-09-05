"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Card, ClaimMap, Collection } from "@/lib/types";
import { getCardUiStatus } from "@/lib/cards";
import {
  fetchUserClaims,
  mergeClaims,
  readCachedClaims,
  writeCachedClaims,
} from "@/lib/claims";
import { getShareCollectionUrl } from "@/lib/site";
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

  const userRef = useRef(user);
  userRef.current = user;
  const totalSlots = cards.length;

  const isLoggedIn = !!user;

  const commitClaims = useCallback((userId: string, incoming: ClaimMap) => {
    setClaims((prev) => {
      const merged = mergeClaims(
        mergeClaims(readCachedClaims(userId), prev),
        incoming
      );
      writeCachedClaims(userId, merged);
      return merged;
    });
  }, []);

  useLayoutEffect(() => {
    if (demoMode) return;
    const uid = initialUser?.id;
    if (!uid) return;
    const cached = readCachedClaims(uid);
    if (Object.keys(cached).length === 0) return;
    setClaims((prev) => mergeClaims(cached, prev));
  }, [demoMode, initialUser?.id]);

  useEffect(() => {
    if (demoMode) return;
    const supabase = createClient();
    let cancelled = false;

    async function hydrateCollection(nextUser: User) {
      if (cancelled) return;
      setUser(nextUser);
      commitClaims(nextUser.id, {});
      const result = await fetchUserClaims(supabase, nextUser.id);
      if (cancelled || !result.ok) return;
      commitClaims(nextUser.id, result.claims);
    }

    async function restoreSession() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        await hydrateCollection(sessionData.session.user);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await hydrateCollection(userData.user);
        return;
      }

      if (initialUser) {
        await hydrateCollection(initialUser);
      }
    }

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setClaims({});
        return;
      }

      if (session?.user) {
        void hydrateCollection(session.user);
      }
    });

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      supabase.auth.getUser().then(({ data: { user: nextUser } }) => {
        if (nextUser) void hydrateCollection(nextUser);
      });
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [demoMode, initialUser, commitClaims]);

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

  useEffect(() => {
    const code = searchParams.get("card") ?? initialCardCode;
    if (!code) return;
    setOpenCode(code);
  }, [searchParams, initialCardCode]);

  const claimedCount = cards.filter((c) => Boolean(claims[c.id])).length;
  const isComplete = totalSlots > 0 && claimedCount === totalSlots;

  const userNick = (user?.user_metadata?.nickname as string)?.trim();
  const shareIdentifier = userNick || user?.id;
  const shareUrl =
    user && shareIdentifier ? getShareCollectionUrl(shareIdentifier) : null;

  const statusOf = useCallback(
    (card: Card) =>
      getCardUiStatus(card, Boolean(claims[card.id]), isLoggedIn),
    [claims, isLoggedIn]
  );

  const openCard = useMemo(() => {
    if (!openCode) return null;
    // Preferir código interno permanente; número público pode se repetir após aposentadoria
    return (
      cards.find((c) => c.code === openCode) ??
      cards.find((c) => c.number === openCode) ??
      null
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
    const addition: ClaimMap = {
      [cardId]: { is_le: isLe, claimed_at: new Date().toISOString() },
    };
    const uid = userRef.current?.id;
    if (uid) {
      commitClaims(uid, addition);
    } else {
      setClaims((prev) => mergeClaims(prev, addition));
    }
    const nextOwned = cards.filter(
      (c) => c.id === cardId || Boolean(claims[c.id])
    ).length;
    if (totalSlots > 0 && nextOwned === totalSlots) {
      setShowCelebration(true);
    }
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

      <DropExplainerBar />

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
