import Link from "next/link";
import Image from "next/image";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "SEM CONEXÃO | ORANGE CARDS",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <SiteShell
      right={
        <Link
          href="/"
          className="glass-btn px-3 py-1.5 text-xs font-bold text-mint sm:text-sm"
        >
          Tentar novamente
        </Link>
      }
    >
      <div className="my-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <Image
          src="/brand/icon.svg"
          alt="Orange Cards"
          width={56}
          height={56}
          className="mb-5 h-14 w-14 opacity-80"
        />
        <h1 className="font-display text-2xl font-black uppercase tracking-wide text-ink sm:text-3xl">
          Você está offline
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          Sem conexão com a internet. Os drops precisam de rede — reconecte e
          tente de novo.
        </p>
        <Link
          href="/"
          className="glass-btn mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-[#04140e] bg-mint"
        >
          Voltar à coleção
        </Link>
      </div>
    </SiteShell>
  );
}
