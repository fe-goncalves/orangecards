"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/middleware";
import { revalidatePath } from "next/cache";
import type { Card, Collection } from "@/lib/types";
import { CARD_SELECT, COLLECTION_SELECT } from "@/lib/demo-data";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false as const, error: "Faça login para acessar o admin." };
  }
  const allow = adminEmails();
  if (allow.length === 0) {
    return {
      ok: false as const,
      error: "ADMIN_EMAILS não configurado no servidor.",
    };
  }
  if (!allow.includes(user.email.toLowerCase())) {
    return { ok: false as const, error: "E-mail não autorizado." };
  }
  return { ok: true as const, user };
}

export type ActionState = { ok: boolean; message: string };

async function uploadIfPresent(
  service: ReturnType<typeof createServiceClient>,
  file: File | null,
  path: string
): Promise<{ path?: string; error?: string }> {
  if (!file || file.size === 0) return {};
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await service.storage.from("cards").upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) return { error: error.message };
  return { path };
}

export async function listAdminData(): Promise<{
  collections: Collection[];
  cards: Card[];
  activeCollection: Collection | null;
}> {
  const gate = await assertAdmin();
  if (!gate.ok) return { collections: [], cards: [], activeCollection: null };

  const service = createServiceClient();
  const { data: collections } = await service
    .from("collections")
    .select(COLLECTION_SELECT)
    .order("order_display", { ascending: true });

  const cols = (collections as Collection[]) ?? [];
  const active = cols.find((c) => c.is_active) ?? cols[0] ?? null;

  let cards: Card[] = [];
  if (active) {
    const { data } = await service
      .from("cards")
      .select(CARD_SELECT)
      .eq("collection_id", active.id)
      .order("order_display", { ascending: true });
    cards = (data as Card[]) ?? [];
  }

  return { collections: cols, cards, activeCollection: active };
}

export async function saveCollection(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const gate = await assertAdmin();
  if (!gate.ok) return { ok: false, message: gate.error };

  const id = String(formData.get("collection_id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const year = Number(formData.get("year") ?? 0) || null;
  const order_display = Number(formData.get("order_display") ?? 0);
  const makeActive = formData.get("is_active") === "on";

  if (!slug || !name) {
    return { ok: false, message: "Slug e nome são obrigatórios." };
  }

  try {
    const service = createServiceClient();

    if (makeActive) {
      await service
        .from("collections")
        .update({ is_active: false })
        .eq("is_active", true);
    }

    const payload = {
      slug,
      name,
      year,
      order_display,
      is_active: makeActive,
    };

    const { error } = id
      ? await service.from("collections").update(payload).eq("id", id)
      : await service.from("collections").insert(payload);

    if (error) return { ok: false, message: error.message };

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/eu");
    return { ok: true, message: `Coleção ${name} salva.` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erro",
    };
  }
}

export async function saveCard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const gate = await assertAdmin();
  if (!gate.ok) return { ok: false, message: gate.error };

  const existingId = String(formData.get("card_id") ?? "").trim();
  const collectionId = String(formData.get("collection_id") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const number = String(formData.get("number") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const order_display = Number(formData.get("order_display") ?? 0);
  const dropStarts = String(formData.get("drop_starts_at") ?? "").trim();
  const dropEnds = String(formData.get("drop_ends_at") ?? "").trim();
  const is_public = formData.get("is_public") === "on";
  const is_active = formData.get("is_active") === "on";
  const leEnabled = formData.get("le_enabled") === "on";
  const leQuota = Number(formData.get("le_quota") ?? 0);
  const leTargetPool = Number(formData.get("le_target_pool") ?? 100);
  const file = formData.get("image") as File | null;
  const leFile = formData.get("le_image") as File | null;

  if (!collectionId || !code) {
    return { ok: false, message: "Coleção e code (ID interno) são obrigatórios." };
  }
  if (leEnabled && leQuota < 1) {
    return { ok: false, message: "LE ativa exige quota ≥ 1." };
  }

  try {
    const service = createServiceClient();

    const existing = existingId
      ? await service
          .from("cards")
          .select("image_path, le_image_path")
          .eq("id", existingId)
          .maybeSingle()
      : null;

    let imagePath = existing?.data?.image_path ?? "";
    let leImagePath = existing?.data?.le_image_path ?? "";

    if (file && file.size > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const up = await uploadIfPresent(service, file, `cards/${code}.${ext}`);
      if (up.error) return { ok: false, message: `Upload: ${up.error}` };
      imagePath = up.path ?? imagePath;
    }

    if (leFile && leFile.size > 0) {
      const ext = leFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const up = await uploadIfPresent(
        service,
        leFile,
        `cards/${code}-LE.${ext}`
      );
      if (up.error) return { ok: false, message: `Upload LE: ${up.error}` };
      leImagePath = up.path ?? leImagePath;
    }

    if (leEnabled && !leImagePath) {
      return { ok: false, message: "LE ativa exige arte Limited Edition." };
    }

    if (is_active && is_public && !imagePath && !dropStarts) {
      // slot vazio ok sem imagem; card ativo sem imagem também ok se for upcoming placeholder
    }

    const payload = {
      collection_id: collectionId,
      code,
      number,
      title,
      subtitle,
      description,
      image_path: imagePath,
      drop_starts_at: dropStarts ? new Date(dropStarts).toISOString() : null,
      drop_ends_at: dropEnds ? new Date(dropEnds).toISOString() : null,
      is_public,
      is_active,
      order_display,
      le_enabled: leEnabled,
      le_quota: leEnabled ? leQuota : 0,
      le_target_pool: Math.max(1, leTargetPool),
      le_image_path: leEnabled ? leImagePath : "",
    };

    const { error } = existingId
      ? await service.from("cards").update(payload).eq("id", existingId)
      : await service.from("cards").upsert(payload, { onConflict: "code" });

    if (error) return { ok: false, message: error.message };

    revalidatePath("/");
    revalidatePath("/eu");
    revalidatePath("/admin");
    return {
      ok: true,
      message: `Card ${number || code} salvo.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erro",
    };
  }
}

export async function quickUpdateCard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const gate = await assertAdmin();
  if (!gate.ok) return { ok: false, message: gate.error };

  const id = String(formData.get("card_id") ?? "");
  const order_display = Number(formData.get("order_display") ?? 0);
  const dropStarts = String(formData.get("drop_starts_at") ?? "").trim();
  const dropEnds = String(formData.get("drop_ends_at") ?? "").trim();
  const is_public = formData.get("is_public") === "on";
  const is_active = formData.get("is_active") === "on";

  if (!id) return { ok: false, message: "ID ausente." };

  try {
    const service = createServiceClient();
    const { error } = await service
      .from("cards")
      .update({
        order_display,
        drop_starts_at: dropStarts ? new Date(dropStarts).toISOString() : null,
        drop_ends_at: dropEnds ? new Date(dropEnds).toISOString() : null,
        is_public,
        is_active,
      })
      .eq("id", id);

    if (error) return { ok: false, message: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, message: "Atualizado." };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erro",
    };
  }
}
