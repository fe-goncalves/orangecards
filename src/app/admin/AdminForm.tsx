"use client";

import { useActionState, useState } from "react";
import {
  saveCard,
  saveCollection,
  quickUpdateCard,
  type ActionState,
} from "./actions";
import type { Card, Collection } from "@/lib/types";
import { leRemaining } from "@/lib/cards";

const empty: ActionState = { ok: false, message: "" };

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  collections: Collection[];
  cards: Card[];
  activeCollection: Collection | null;
};

export function AdminPanel({ collections, cards, activeCollection }: Props) {
  const [tab, setTab] = useState<"cards" | "new" | "collections">("cards");
  const [editing, setEditing] = useState<Card | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Tab
          active={tab === "cards"}
          onClick={() => setTab("cards")}
          label={`Cards (${cards.length})`}
        />
        <Tab
          active={tab === "new"}
          onClick={() => {
            setEditing(null);
            setTab("new");
          }}
          label={editing ? "Editar card" : "Novo card"}
        />
        <Tab
          active={tab === "collections"}
          onClick={() => setTab("collections")}
          label="Coleções"
        />
      </div>

      {activeCollection && tab !== "collections" && (
        <p className="text-sm text-ink-muted">
          Coleção ativa:{" "}
          <span className="text-ink">{activeCollection.name}</span> (
          {activeCollection.slug})
        </p>
      )}

      {tab === "collections" && (
        <CollectionsTab collections={collections} />
      )}

      {tab === "cards" && (
        <div className="space-y-3">
          {!activeCollection && (
            <p className="text-sm text-danger">
              Crie e ative uma coleção antes de publicar cards.
            </p>
          )}
          {cards.map((c) => (
            <article
              key={c.id}
              className="rounded-sm border border-line bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-brand">
                    #{c.number || "—"} · <span className="text-ink-faint">{c.code}</span>
                  </p>
                  <h3 className="font-display text-2xl tracking-wide text-ink">
                    {c.title || "(sem título)"}
                  </h3>
                  <p className="text-xs text-ink-muted">
                    ordem {c.order_display}
                    {" · "}
                    {c.is_public ? "público" : "privado"}
                    {" · "}
                    {c.is_active ? "ativo" : "inativo (slot)"}
                    {c.le_enabled && (
                      <span className="ml-2 text-le">
                        LE {c.le_awarded}/{c.le_quota} (
                        {leRemaining(c)} rest.)
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-sm border border-line px-3 py-1.5 text-sm hover:border-brand"
                  onClick={() => {
                    setEditing(c);
                    setTab("new");
                  }}
                >
                  Editar
                </button>
              </div>
              <QuickRow card={c} />
            </article>
          ))}
        </div>
      )}

      {tab === "new" && activeCollection && (
        <CardForm
          key={editing?.id ?? "new"}
          collectionId={activeCollection.id}
          initial={editing}
          onDone={() => {
            setEditing(null);
            setTab("cards");
          }}
        />
      )}
    </div>
  );
}

function CollectionsTab({ collections }: { collections: Collection[] }) {
  const [state, action, pending] = useActionState(saveCollection, empty);
  const [edit, setEdit] = useState<Collection | null>(null);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-ink-muted">Existentes</h2>
        {collections.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setEdit(c)}
            className="flex w-full items-center justify-between rounded-sm border border-line bg-surface px-3 py-2 text-left text-sm hover:border-brand"
          >
            <span>
              {c.name}{" "}
              <span className="text-ink-faint">({c.slug})</span>
            </span>
            {c.is_active && (
              <span className="text-xs font-bold text-brand">ATIVA</span>
            )}
          </button>
        ))}
      </div>
      <form action={action} className="space-y-3 rounded-sm border border-line p-4">
        <h2 className="font-display text-xl text-brand">
          {edit ? "Editar coleção" : "Nova coleção"}
        </h2>
        {edit && <input type="hidden" name="collection_id" value={edit.id} />}
        <Field label="Slug" name="slug" defaultValue={edit?.slug ?? ""} required placeholder="s8" />
        <Field label="Nome" name="name" defaultValue={edit?.name ?? ""} required placeholder="Season 8 / 26 II" />
        <Field label="Ano" name="year" type="number" defaultValue={String(edit?.year ?? 2026)} />
        <Field label="Ordem" name="order_display" type="number" defaultValue={String(edit?.order_display ?? 0)} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={edit?.is_active ?? false}
            className="accent-brand"
          />
          Marcar como coleção ativa no site
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm bg-brand px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {pending ? "…" : "Salvar coleção"}
          </button>
          {edit && (
            <button
              type="button"
              onClick={() => setEdit(null)}
              className="rounded-sm border border-line px-3 py-2 text-sm"
            >
              Nova
            </button>
          )}
        </div>
        {state.message && (
          <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}

function QuickRow({ card }: { card: Card }) {
  const [state, action, pending] = useActionState(quickUpdateCard, empty);
  return (
    <form
      action={action}
      className="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-6 sm:items-end"
    >
      <input type="hidden" name="card_id" value={card.id} />
      <Field
        label="Ordem"
        name="order_display"
        type="number"
        defaultValue={String(card.order_display)}
      />
      <Field
        label="Drop início"
        name="drop_starts_at"
        type="datetime-local"
        defaultValue={toLocalInput(card.drop_starts_at)}
      />
      <Field
        label="Drop fim"
        name="drop_ends_at"
        type="datetime-local"
        defaultValue={toLocalInput(card.drop_ends_at)}
      />
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input type="checkbox" name="is_public" defaultChecked={card.is_public} className="accent-brand" />
        Público
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={card.is_active} className="accent-brand" />
        Ativo
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-surface-2 px-3 py-2 text-sm hover:bg-line disabled:opacity-60"
      >
        {pending ? "…" : "Aplicar"}
      </button>
      {state.message && (
        <p className={`sm:col-span-6 text-xs ${state.ok ? "text-ok" : "text-danger"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

function CardForm({
  collectionId,
  initial,
  onDone,
}: {
  collectionId: string;
  initial: Card | null;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const res = await saveCard(prev, fd);
      if (res.ok) onDone();
      return res;
    },
    empty
  );
  const [leOn, setLeOn] = useState(initial?.le_enabled ?? false);

  return (
    <form action={action} className="mx-auto max-w-lg space-y-4">
      <input type="hidden" name="collection_id" value={collectionId} />
      {initial && <input type="hidden" name="card_id" value={initial.id} />}

      <Field
        label="Code (ID interno)"
        name="code"
        defaultValue={initial?.code}
        required
        placeholder="S8-W05-006"
      />
      <Field
        label="Numeração (pública)"
        name="number"
        defaultValue={initial?.number}
        placeholder="06"
      />
      <Field label="Título (opcional)" name="title" defaultValue={initial?.title} />
      <Field label="Subtítulo (opcional)" name="subtitle" defaultValue={initial?.subtitle} />
      <div>
        <label className="mb-1 block text-sm text-ink-muted" htmlFor="description">
          Descrição (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description}
          className="w-full rounded-sm border border-line bg-bg px-3 py-2 text-sm"
        />
      </div>
      <Field
        label="Ordem de exibição"
        name="order_display"
        type="number"
        defaultValue={String(initial?.order_display ?? 0)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Drop início"
          name="drop_starts_at"
          type="datetime-local"
          defaultValue={toLocalInput(initial?.drop_starts_at)}
        />
        <Field
          label="Drop fim"
          name="drop_ends_at"
          type="datetime-local"
          defaultValue={toLocalInput(initial?.drop_ends_at)}
        />
      </div>
      <FileField
        label={initial?.image_path ? "Imagem (vazio = manter)" : "Imagem"}
        name="image"
      />
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_public" defaultChecked={initial?.is_public ?? true} className="accent-brand" />
          Público
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} className="accent-brand" />
          Ativo
        </label>
      </div>
      <p className="text-xs text-ink-muted">
        Público + inativo = slot vazio no álbum. Privado = só admin.
      </p>

      <fieldset className="space-y-3 rounded-sm border border-le/30 bg-le/5 p-4">
        <legend className="px-1 text-sm font-semibold text-le">LE</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="le_enabled"
            checked={leOn}
            onChange={(e) => setLeOn(e.target.checked)}
            className="accent-le"
          />
          Ativar Limited Edition
        </label>
        {leOn && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quota" name="le_quota" type="number" defaultValue={String(initial?.le_quota || 3)} />
              <Field label="Pool estimado" name="le_target_pool" type="number" defaultValue={String(initial?.le_target_pool || 40)} />
            </div>
            <FileField
              label={initial?.le_image_path ? "Arte LE (vazio = manter)" : "Arte LE"}
              name="le_image"
              required={!initial?.le_image_path}
            />
          </>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-brand px-4 py-3 font-semibold uppercase tracking-wide text-black disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar card"}
      </button>
      {state.message && (
        <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>
      )}
    </form>
  );
}

function Tab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm px-3 py-1.5 text-sm font-medium ${
        active ? "bg-brand text-black" : "border border-line text-ink-muted"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-ink-muted" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-sm border border-line bg-bg px-3 py-2 text-sm text-ink"
      />
    </div>
  );
}

function FileField({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-ink-muted" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        required={required}
        className="w-full text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-brand file:px-3 file:py-1.5 file:font-semibold file:text-black"
      />
    </div>
  );
}
