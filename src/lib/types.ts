/**
 * Modelo de dados Orange Cards (fonte da verdade — v2)
 *
 * COLLECTION (ano / season)
 * - slug, name, year, is_active (só uma no site), order_display
 *
 * CARD
 * - id            UUID definitivo (claims usam este ID — nunca number)
 * - code          Código interno permanente único (independente do number)
 * - number        Numeração pública (#01) — só exibição; pode repetir após aposentar
 * - title|subtitle|description  opcionais
 * - image + drop_starts_at/drop_ends_at
 * - is_public / is_active
 *     public + !active  → slot vazio no álbum
 *     public + active   → card “de verdade” (drop / claim)
 *     !public           → só admin (aposentado / rascunho)
 * - order_display
 * - LE: le_enabled, le_quota, le_target_pool, le_image_path
 *     se claim.is_le → arte LE SUBSTITUI a padrão na view do usuário
 *
 * CLAIM
 * - user_id + card_id(UUID) unique — identidade do card, não da numeração
 *
 * View do colecionador (álbum):
 * - owned → arte (LE se premiado)
 * - live (janela) → arte + Salvar
 * - upcoming / missed / slot inativo → silhueta (espaço p/ figurinha)
 */

export type Collection = {
  id: string;
  slug: string;
  name: string;
  year: number | null;
  is_active: boolean;
  order_display: number;
};

export type Card = {
  id: string;
  collection_id: string;
  /** Código interno permanente (não muda com a numeração pública) */
  code: string;
  /** Numeração pública exibida (#01) */
  number: string;
  title: string;
  subtitle: string;
  description: string;
  image_path: string;
  drop_starts_at: string | null;
  drop_ends_at: string | null;
  is_public: boolean;
  is_active: boolean;
  order_display: number;
  le_enabled: boolean;
  le_quota: number;
  le_awarded: number;
  le_target_pool: number;
  le_image_path: string;
};

export type Claim = {
  id: string;
  user_id: string;
  card_id: string;
  claimed_at: string;
  is_le: boolean;
};

export type ClaimMap = Record<string, { is_le: boolean; claimed_at: string }>;

/**
 * empty_slot = figurinha em branco (inativo, missed)
 * upcoming = drop agendado (booster + countdown)
 * live / owned = arte / pacote ao vivo
 */
export type CardUiStatus = "empty_slot" | "upcoming" | "live" | "owned";

export type AlbumFilter = "all" | "live" | "mine";

export type ClaimResult = {
  ok: boolean;
  already?: boolean;
  is_le?: boolean;
  error?: string;
  message: string;
};
