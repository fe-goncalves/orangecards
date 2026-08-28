import type { Card, Collection } from "./types";

export const DEMO_COLLECTION: Collection = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "s8",
  name: "Season 8 / 26 II",
  year: 2026,
  is_active: true,
  order_display: 8,
};

const base = {
  collection_id: DEMO_COLLECTION.id,
  title: "",
  subtitle: "",
  description: "",
  image_path: "",
  is_public: true,
  is_active: true,
  le_enabled: false,
  le_quota: 0,
  le_awarded: 0,
  le_target_pool: 100,
  le_image_path: "",
};

export function getDemoCards(now = new Date()): Card[] {
  const t = now.getTime();
  const iso = (ms: number) => new Date(ms).toISOString();

  return [
    {
      ...base,
      id: "00000000-0000-4000-8000-000000000011",
      code: "S8-W01-001",
      number: "01",
      title: "Capitão Laranja",
      subtitle: "Liderança · Rodada 1",
      description: "Líder em campo. Card de abertura da Season 8.",
      image_path: "/cards/s8-w01-001.svg",
      drop_starts_at: iso(t - 5 * 86400000),
      drop_ends_at: iso(t - 3 * 86400000),
      order_display: 1,
    },
    {
      ...base,
      id: "00000000-0000-4000-8000-000000000012",
      code: "S8-W02-002",
      number: "02",
      title: "Muralha",
      subtitle: "Goleiro · Rodada 2",
      description: "Última linha.",
      image_path: "/cards/s8-w02-002.svg",
      drop_starts_at: iso(t - 3 * 86400000),
      drop_ends_at: iso(t - 1 * 86400000),
      order_display: 2,
    },
    {
      ...base,
      id: "00000000-0000-4000-8000-000000000013",
      code: "S8-W02-005",
      number: "03",
      title: "Canhoto",
      subtitle: "Ponta · Rodada 2",
      image_path: "/cards/s8-w02-005.svg",
      drop_starts_at: iso(t - 4 * 86400000),
      drop_ends_at: iso(t - 2 * 86400000),
      order_display: 3,
    },
    {
      ...base,
      id: "00000000-0000-4000-8000-000000000014",
      code: "S8-W03-003",
      number: "04",
      title: "Raio",
      subtitle: "Meia · Rodada 3",
      description: "Drop aberto — salve na janela.",
      image_path: "/cards/s8-w03-003.svg",
      drop_starts_at: iso(t - 6 * 3600000),
      drop_ends_at: iso(t + 18 * 3600000),
      order_display: 4,
      le_enabled: true,
      le_quota: 3,
      le_awarded: 0,
      le_target_pool: 40,
      le_image_path: "/cards/s8-w03-003-le.svg",
    },
    {
      ...base,
      id: "00000000-0000-4000-8000-000000000015",
      code: "S8-W04-004",
      number: "05",
      title: "",
      subtitle: "",
      description: "Surpresa — aguarde o drop.",
      image_path: "/cards/s8-w04-004.svg",
      drop_starts_at: iso(t + 2 * 86400000),
      drop_ends_at: iso(t + 4 * 86400000),
      order_display: 5,
    },
    {
      ...base,
      id: "00000000-0000-4000-8000-000000000016",
      code: "S8-SLOT-006",
      number: "06",
      title: "",
      image_path: "",
      drop_starts_at: null,
      drop_ends_at: null,
      is_active: false,
      order_display: 6,
    },
  ];
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export const CARD_SELECT =
  "id, collection_id, code, number, title, subtitle, description, image_path, drop_starts_at, drop_ends_at, is_public, is_active, order_display, le_enabled, le_quota, le_awarded, le_target_pool, le_image_path";

export const COLLECTION_SELECT =
  "id, slug, name, year, is_active, order_display";
