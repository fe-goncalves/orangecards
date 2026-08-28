"use client";

import type { AlbumFilter } from "@/lib/types";

type Props = {
  filter: AlbumFilter;
  onChange: (f: AlbumFilter) => void;
  isLoggedIn: boolean;
};

const BASE: { id: AlbumFilter; label: string; needsAuth?: boolean }[] = [
  { id: "all", label: "Todos" },
  { id: "live", label: "Drop aberto" },
  { id: "mine", label: "Meu álbum", needsAuth: true },
];

export function FilterBar({ filter, onChange, isLoggedIn }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtros">
      {BASE.filter((f) => !f.needsAuth || isLoggedIn).map((f) => {
        const active = filter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(f.id)}
            className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint ${
              active
                ? "bg-mint text-[#04140e]"
                : "border border-line text-ink-muted hover:border-mint hover:text-mint"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
