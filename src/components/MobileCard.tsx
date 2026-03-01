"use client";

import React from "react";

/* ------------------------------------------------------------------ */
/*  Generic card field                                                 */
/* ------------------------------------------------------------------ */
export type CardField = {
  label: string;
  value: React.ReactNode;
};

/* ------------------------------------------------------------------ */
/*  MobileCard – single card that replaces one table row               */
/* ------------------------------------------------------------------ */
type MobileCardProps = {
  /** Primary text shown large at the top */
  title: React.ReactNode;
  /** Optional secondary text */
  subtitle?: React.ReactNode;
  /** Optional badge (e.g. status) */
  badge?: { text: string; className?: string };
  /** Key-value pairs rendered in a 2-col grid */
  fields?: CardField[];
  /** Action buttons rendered at the bottom */
  actions?: React.ReactNode;
  /** Optional checkbox for bulk selection */
  checkbox?: { checked: boolean; onChange: () => void };
};

export function MobileCard({ title, subtitle, badge, fields, actions, checkbox }: MobileCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      {/* Header row: checkbox + title + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {checkbox && (
            <input
              type="checkbox"
              checked={checkbox.checked}
              onChange={checkbox.onChange}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-white/10 text-lime-400 focus:ring-lime-400/60"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.className ?? "bg-white/10 text-slate-200"}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Fields grid */}
      {fields && fields.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {fields.map((f, i) => (
            <div key={i}>
              <span className="text-slate-500">{f.label}</span>
              <p className="text-slate-200 truncate">{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileCardList – wraps an array of cards with loading/empty states  */
/* ------------------------------------------------------------------ */
type MobileCardListProps = {
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
};

export function MobileCardList({
  children,
  loading,
  empty,
  emptyMessage = "Kayit bulunamadi.",
  loadingMessage = "Yukleniyor...",
}: MobileCardListProps) {
  if (loading) {
    return (
      <div className="space-y-3 md:hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="h-4 w-2/3 rounded bg-white/10" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-3 rounded bg-white/5" />
              <div className="h-3 rounded bg-white/5" />
            </div>
          </div>
        ))}
        <p className="text-center text-xs text-slate-500">{loadingMessage}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400 md:hidden">
        {emptyMessage}
      </div>
    );
  }

  return <div className="space-y-3 md:hidden">{children}</div>;
}

/* ------------------------------------------------------------------ */
/*  Shared small action button styles                                  */
/* ------------------------------------------------------------------ */
export function CardAction({
  children,
  onClick,
  variant = "default",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: boolean;
}) {
  const base = "rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50";
  const variants: Record<string, string> = {
    default: "border border-white/10 text-slate-200 hover:border-lime-300/70 hover:text-white",
    danger: "border border-red-500/50 text-red-200 hover:bg-red-500/10",
    success: "border border-lime-300/70 text-lime-200 hover:bg-lime-400/10",
    warning: "border border-amber-400/60 text-amber-200 hover:bg-amber-400/10",
  };

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}
