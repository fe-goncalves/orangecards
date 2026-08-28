# PROMPT COMPLETO — Construir o site Orange Cards (Álbum Digital)

Copie **tudo abaixo da linha** para um chat novo numa pasta/projeto vazia. Anexe também o arquivo `SPEC-ALBUM-v1.md` se estiver na pasta.

---

Você é um engenheiro full-stack sênior. Sua missão é **construir do zero** o MVP do site **Orange Cards — Álbum Digital** da Orange (organização de futebol 7 amador de Curitiba).

Leia e obedeça o SPEC em `SPEC-ALBUM-v1.md` (se existir na pasta). Se não existir, use integralmente as regras deste prompt — elas são a fonte da verdade do v1.

## Contexto do produto

A Orange lança 1–2 “cards” oficiais por semana (estilo figurinha/Pokémon esportivo), numerados. O público vê o álbum da temporada. Quem cria conta pode **“Salvar”** o card **somente durante uma janela de poucas horas** após o drop. No fim da Season, quem salvou todos completa o álbum. O físico (print) fica fora do site — só cerimônia no fim do ano.

**Objetivo de UX:** one-page ultrassimples. A view de quem só quer **ver** e de quem quer **colecionar** deve ser praticamente igual; a diferença é login + botão Salvar + marcação de obtido.

**Objetivo de segurança:** superfície mínima. Sem inventar auth própria. Risco baixo via arquitetura magra (não prometa “inhackeável”).

## Stack obrigatória (v1)

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind
- **Host-ready:** Vercel
- **Backend:** Supabase (Auth + Postgres + Storage)
- **Claim:** validação **somente no servidor** (Supabase RPC ou Edge Function). Nunca confiar no client para a janela de tempo.

Não use Firebase, não monte Express próprio, não use senha/email inventado sem provider. Preferir **Magic Link** e, se fácil, Google OAuth.

## O que construir (escopo v1 — não ultrapasse)

### Página única `/`

1. Header: “ORANGE CARDS” + Season ativa (ex.: Season 8 / 26 II) + botão Entrar / avatar+Sair
2. Progresso do usuário logado: `X/Y cards` e badge “Álbum completo” se X===Y
3. Filtros simples: Todos | Drop aberto | Meu álbum (logado)
4. **Grade de cards** responsiva (mobile-first)
5. Clique no card abre **modal/painel** com:
   - imagem
   - código (ex.: `S8-W01-001`)
   - título e subtítulo
   - status do drop (countdown se Live)
   - CTA conforme estado
6. Deep link: `/?card=S8-W01-001` abre o modal desse card
7. Footer com 3 linhas de regras (“Salve na janela do drop. Fora dela, o card entra no álbum público mas não no seu.”)

### Estados do card

- **Upcoming:** ainda não publicado / antes do drop → silhueta ou placeholder “Em breve”
- **Live:** dentro de `drop_starts_at`–`drop_ends_at` → arte visível + badge DROP ABERTO
- **Owned:** usuário logado já claimou → check “No seu álbum”
- **Missed:** logado, drop encerrou, sem claim → arte visível com label “Não salvo a tempo” (não esconder a arte)
- **Public past:** visitante após drop → arte visível; CTA “Entre para colecionar os próximos”

**Decisão de produto:** após o drop a arte continua pública. O que é exclusivo é o **claim** no álbum do usuário.

### Auth

- Magic link (email)
- Sessão persistente
- Sem perfil complexo no v1 (email basta)

### Claim ( Salvar )

Regras:

1. Usuário autenticado
2. `now` entre `drop_starts_at` e `drop_ends_at`
3. Card `published = true`
4. No máximo 1 claim por `(user_id, card_id)` — UNIQUE no banco
5. Resposta idempotente se já tiver claim (“Já está no seu álbum”)
6. Fora da janela → erro claro, sem insert

Implementar com **RLS + RPC** (ou Edge Function). O browser só chama a função; não calcula elegibilidade sozinho.

### Admin / publicação de card (mínimo)

No v1, aceitável:

- SQL seed + instruções no README para criar card pelo Supabase Dashboard, **ou**
- Rota `/admin` protegida por allowlist de emails (env `ADMIN_EMAILS`) com formulário: título, subtítulo, week, código, upload imagem, drop start/end, publish

Prefira a opção com `/admin` simples se der tempo; senão Dashboard + README impecável.

### Seed

Criar 3–6 cards fake da “Season 8” para demo:

- 1 Live (janela aberta agora)
- 1–2 past (já expiraram)
- 1 upcoming
- Imagens placeholder (pode ser solid color + texto SVG ou unsplash esportivo)

## Schema SQL (criar migration)

```sql
-- seasons
id uuid pk
slug text unique  -- 's8'
name text
active boolean default false

-- cards
id uuid pk
season_id uuid fk
code text unique  -- 'S8-W01-001'
title text
subtitle text
week_number int
image_path text  -- path no storage
drop_starts_at timestamptz
drop_ends_at timestamptz
published boolean default false
sort_order int default 0

-- claims
id uuid pk
user_id uuid references auth.users
card_id uuid fk
claimed_at timestamptz default now()
unique(user_id, card_id)
```

RLS:

- Qualquer um (anon) lê seasons ativas e cards `published = true`
- Usuário lê apenas seus claims
- Insert claim **somente** via RPC `claim_card(card_id)` que valida janela e published
- Service role para admin/upload

Storage bucket `cards` — leitura pública das imagens publicadas; escrita só service role/admin.

## Design visual

- Estética esportiva contemporânea, escura ou alto contraste — **não** parecer SaaS genérico roxo
- Tipografia forte nos títulos; cards com proporção tipo figurinha vertical (ex. 2:3)
- Microinteração leve no Salvar (feedback imediato)
- Sem emoji excessivo; laranja da marca como acento (`#FF5A00` ou similar — criar tokens CSS)
- Acessível: foco, contraste, modal fechável com ESC

Nome do produto na UI: **ORANGE CARDS**  
Subtítulo: álbum da temporada (Season 8)

## Qualidade de engenharia

- TypeScript strict
- Componentes claros: `CardGrid`, `CardTile`, `CardModal`, `AuthButton`, `ProgressBar`
- Env example: `.env.local.example` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, e server keys só se necessário para admin
- README em português com:
  1. Como subir (Supabase + Vercel)
  2. Como criar a migration
  3. Como publicar um card novo (operação semanal)
  4. Como testar o drop (manipular timestamps)
  5. Limitações do v1
- Não deixar TODOs críticos sem implementação no caminho feliz

## Fora de escopo (NÃO implementar)

- Votação de atletas
- Pagamentos / NFT / blockchain
- Comentários, likes, feed social
- App React Native
- Multi-idioma
- Notificações push
- Marketplace de troca de cards
- “Completar álbum” comprando slots perdidos

## Entrega esperada

1. App Next.js funcionando localmente com Supabase (instruções claras)
2. Migration SQL versionada
3. RPC `claim_card`
4. UI one-page completa nos estados acima
5. Seed de demo
6. README operacional

## Ordem de implementação sugerida

1. Schema + RLS + RPC  
2. Auth magic link  
3. Grade + modal (dados reais)  
4. Claim + progresso  
5. Deep link `?card=`  
6. Admin mínimo ou fluxo Dashboard documentado  
7. Polish mobile + README  

## Critério de aceite

Um usuário novo consegue: abrir o site → ver o álbum → entrar por magic link → salvar o card Live → ver progresso atualizar → abrir de novo e ver “Já salvo”. Um visitante sem login vê as mesmas artes públicas e entende que precisa entrar para colecionar.

Comece criando a estrutura do projeto e a migration. Não pergunte confirmações óbvias do SPEC — execute o v1 completo.
