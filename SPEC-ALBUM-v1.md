# Orange Cards — Álbum Digital (SPEC v1)

Produto: álbum one-page da temporada. Visitante e colecionador veem a **mesma interface**. Colecionar = login + “Salvar” dentro da janela de drop.

**Fora do v1:** votação no site, loja, NFT, frete, app mobile nativo, chat, ranking competitivo complexo, upload público por usuários.

---

## 1. Conceito

| Peça | Descrição |
|---|---|
| **Card** | Arte oficial numerada da semana (atleta, comissão ou equipe) |
| **Drop** | Janela de tempo em que o card pode ser “salvo” |
| **Claim** | Registro `user + card` no servidor (= slot no álbum) |
| **Álbum** | Grade da Season; cards obtidos ficam marcados; não obtidos ficam silhueta/bloqueados após o drop |
| **Completar** | Ter claim de **todos** os cards publicados da Season |

Exclusividade ≠ impedir download do PNG. Exclusividade = **estar no álbum oficial logado**.

---

## 2. One-page — estrutura visual

Uma única rota `/` (ou `/s8` se quiser season na URL depois).

```
┌─────────────────────────────────────────┐
│ Header: ORANGE CARDS · Season 8         │
│ [Entrar] ou avatar / Sair               │
│ Progresso: 4/12 cards · Completo?       │
├─────────────────────────────────────────┤
│ Filtros leves: Todos | Disponíveis |    │
│ Meu álbum (só logado)                   │
├─────────────────────────────────────────┤
│ Grade de cards (responsiva)             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │ W1 │ │ W2 │ │ W3 │ │ …  │           │
│  └────┘ └────┘ └────┘ └────┘           │
├─────────────────────────────────────────┤
│ Modal do card (mesmo layout p/ todos)   │
│  imagem grande · número · nome · semana │
│  CTA: [Salvar] | [Já salvo] | [Expirado]│
│  | [Faça login para salvar]             │
├─────────────────────────────────────────┤
│ Footer: regras em 3 linhas              │
└─────────────────────────────────────────┘
```

**Visitante e colecionador = mesma view.** Diferença só no CTA e no destaque “obtido” na grade.

---

## 3. Estados do card (UI)

| Estado | Quem vê | Aparência | CTA |
|---|---|---|---|
| **Upcoming** | Todos | Silhueta / “Em breve” | — |
| **Live** | Todos | Arte visível + badge “DROP ABERTO” | Salvar / Login / Já salvo |
| **Owned** | Logado que claimou | Arte + check | Já salvo |
| **Missed** | Logado que não claimou após fim | Arte com overlay “Não salvo” **ou** silhueta (escolher uma e manter) | — |
| **Public past** | Visitante após drop | Arte visível (álbum público da season) | Login para colecionar próximos |

**Decisão v1 recomendada:** após o drop, a arte continua **visível para todos** (álbum público). Só o *slot de coleção* exige claim na janela. Assim a view fica quase idêntica.

---

## 4. Regras de negócio

1. Um usuário pode claimar cada card **no máximo 1 vez**.
2. Claim só se `now` ∈ `[drop_starts_at, drop_ends_at]`.
3. Claim **só no servidor** (nunca confiar no client).
4. Janela típica: 24–48h (configurável por card).
5. Season completa = claims ≥ todos os cards com `status = published` da season ativa.
6. Admin cria/edita cards (arte, metadados, janela) — **não** via formulário público.

---

## 5. Dados (mínimo)

### `seasons`
- `id`, `slug` (`s8`), `name`, `active` (bool)

### `cards`
- `id`, `season_id`
- `code` — ex.: `S8-W02-014` (visível na arte e na UI)
- `title` — nome do atleta/equipe
- `subtitle` — ex.: “Herói · Rodada 2”
- `week_number` (int)
- `image_url`
- `drop_starts_at`, `drop_ends_at` (timestamptz)
- `published` (bool)
- `sort_order`

### `claims`
- `id`, `user_id`, `card_id`, `claimed_at`
- **UNIQUE** `(user_id, card_id)`

### Auth
- Provider gerenciado (magic link e/ou Google). Sem senha caseira no v1.

---

## 6. Segurança (superfície mínima)

- RLS: usuário lê cards published; lê/insere **apenas seus** claims; insert claim validado por policy ou Edge Function checando janela.
- Service role **nunca** no browser.
- Storage: imagens públicas read-only; upload só com service role / admin.
- Rate limit no endpoint de claim.
- Sem HTML livre de usuário; sem upload de user; sem API admin no client.
- Headers básicos (CSP razoável) no host.

---

## 7. Admin (operação semanal)

Mínimo aceitável no v1:

- Script/`seed` ou painel **protegido** (só você): criar card, upload imagem, setar janela, publish.
- Alternativa ainda mais simples: inserir via Supabase Dashboard + Storage na primeira season.

Fluxo semanal: arte pronta → sobe card → define drop → posta Instagram com link `/?card=S8-W02-014`.

---

## 8. Completar o álbum

- Banner: “Álbum completo · Season 8” quando progresso = 100%.
- Opcional v1.1: exportar “diploma” PNG estático.
- Físico: fora do site — cerimônia no fim da season (gráfica amadora).

---

## 9. Stack sugerida

| Camada | Escolha |
|---|---|
| Front | Next.js (App Router) ou Vite + React — **one page** |
| Host | Vercel |
| Auth + DB + Storage | **Supabase** |
| Claim | RPC/Edge Function + UNIQUE constraint |

Não inventar backend próprio no v1.

---

## 10. Critérios de pronto (v1)

- [ ] Grade da season na home
- [ ] Modal de card idêntico para anônimo e logado
- [ ] Login magic link ou Google
- [ ] Salvar só na janela; bloqueio fora; idempotente
- [ ] Progresso X/Y e estado “completo”
- [ ] Deep link `?card=CODE`
- [ ] Mobile-first, rápido, sem dashboard inchado
- [ ] README com: env vars, como publicar um card, como testar drop

---

## 11. Não fazer no v1

Votação, marketplace, comentários, DM, multi-season switcher complexo, rarezas animadas pesadas, app nativo, pagamentos.
