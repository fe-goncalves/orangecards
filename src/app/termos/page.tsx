import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Termos e Privacidade | Orange Cards",
  description: "Termos de uso e política de privacidade da Orange Cards Season 8.",
};

export default function TermosPage() {
  return (
    <SiteShell
      right={
        <Link
          href="/"
          className="text-xs font-medium text-ink-muted transition hover:text-mint sm:text-sm"
        >
          Voltar ao álbum
        </Link>
      }
    >
      <article className="mx-auto max-w-2xl pb-12">
        <p className="text-[11px] tracking-[0.14em] uppercase text-ink-faint">
          Season 8
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
          Termos e privacidade
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Última atualização: setembro de 2026.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-muted">
          <section className="space-y-2">
            <h2 className="text-base font-medium text-ink">1. O que é a Orange Cards</h2>
            <p>
              A Orange Cards é uma experiência digital da Copa Orange para
              colecionar cards da Season 8, abrir drops e disputar edições
              limitadas (LE). Os cards digitais não são investimento financeiro
              nem garantia de prêmio físico, salvo comunicação oficial em
              contrário.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-ink">2. Conta</h2>
            <p>
              Você precisa de e-mail válido e nickname único. É responsável por
              manter a senha em sigilo e por toda atividade na sua conta. Contas
              com conteúdo ofensivo, impersonação ou abuso podem ser suspensas.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-ink">3. Coleção e drops</h2>
            <p>
              Claims são pessoais e vinculados à sua conta. Janelas de drop,
              cotas de LE e disponibilidade podem mudar conforme a operação do
              evento. Tentativas de exploração técnica, bots ou multi-conta para
              fraudar sorteios podem resultar em perda de claims e banimento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-ink">4. Privacidade</h2>
            <p>
              Tratamos e-mail, nickname e dados de coleção para operar o álbum,
              autenticação e compartilhamento público da coleção (quando você
              compartilha o link). Não vendemos seus dados. Links públicos
              mostram apenas o progresso da coleção associado ao nickname.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-ink">5. Contato</h2>
            <p>
              Dúvidas sobre conta, drops ou estes termos: canais oficiais da
              Copa Orange / Orange Cards.
            </p>
          </section>
        </div>
      </article>
    </SiteShell>
  );
}
