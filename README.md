# Orange Cards — Álbum Digital

Coleções multi-ano. Visitante e colecionador veem o mesmo álbum; colecionar = login + **Salvar** na janela. LE substitui a arte padrão se premiado.

## Modelo (fonte da verdade)

### Collection
`slug`, `name`, `year`, `is_active` (só uma no site), `order_display`

### Card
| Campo | Papel |
|---|---|
| `code` | ID **interno** único |
| `number` | Numeração **pública** (admin) |
| title / subtitle / description | Opcionais |
| `image_path` + drop start/end | Arte e janela |
| `is_public` / `is_active` | Ver matriz abaixo |
| `order_display` | Ordem na grade |
| LE | quota, pool, arte especial |

**Matriz public × active**

| | ativo | inativo |
|---|---|---|
| **público** | Card real (drop/claim) | Slot vazio no álbum |
| **privado** | Só admin | Só admin |

**View do usuário**
- Owned → arte (LE **substitui** se `is_le`)
- Live → arte + Salvar
- Upcoming / missed / slot inativo → silhueta (espaço p/ figurinha)

## Criar Supabase

1. New project em [supabase.com](https://supabase.com)
2. Settings → API → URL, anon, service_role → `.env.local`
3. SQL Editor: rode **apenas** `supabase/migrations/20250827120000_init.sql`
4. Auth Email + redirect `http://localhost:3000/auth/callback`
5. `ADMIN_EMAILS=seu@email.com`
6. `npm run dev`

## Admin (projeto separado)

Painel em `/admin` — domínio próprio na Cloudflare. Ver `admin/README.md`.

```bash
cd admin && npm run dev   # http://localhost:3002
cd admin && npm run deploy
```
