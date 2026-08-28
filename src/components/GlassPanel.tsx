"use client";

import { Icon } from "./Icon";

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  className?: string;
  wide?: boolean;
};

export function GlassPanel({
  children,
  title,
  subtitle,
  onClose,
  className = "",
  wide,
}: Props) {
  return (
    <div
      className={`glass-panel modal-scroll relative w-full max-h-[min(92dvh,720px)] overflow-y-auto ${wide ? "max-w-lg" : "max-w-sm"} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        className="glass-icon-btn absolute right-3 top-3 z-10"
        aria-label="Fechar"
      >
        <Icon name="close" size={16} />
      </button>

      {(title || subtitle) && (
        <div className="mb-4 pr-10">
          {title && (
            <h2 className="text-lg font-medium tracking-tight text-ink">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">{subtitle}</p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

export function GlassBackdrop({
  onClose,
  children,
  center = true,
}: {
  onClose: () => void;
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex bg-black/80 backdrop-blur-md ${
        center
          ? "items-end sm:items-center justify-center p-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:p-4"
          : ""
      }`}
      role="presentation"
      onClick={onClose}
    >
      {children}
    </div>
  );
}
