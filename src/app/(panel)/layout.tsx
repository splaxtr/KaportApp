// Client layout for navigation highlighting
"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Özet", icon: "🏁" },
  { href: "/customers", label: "Müşteriler", icon: "👤" },
  { href: "/vehicles", label: "Araçlar", icon: "🚗" },
  { href: "/experts", label: "Eksperler", icon: "🧑‍🔧" },
  { href: "/review-links", label: "Sigorta İnceleme", icon: "🔗" },
  { href: "/trash", label: "Silinenler", icon: "🗑️" },
  { href: "/settings", label: "Ayarlar", icon: "⚙️" },
];

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const segment = useSelectedLayoutSegment();
  const isActive = href === `/${segment ?? ""}` || (href === "/dashboard" && segment === null);
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-white/15 text-white ring-1 ring-lime-300/60 shadow-[0_10px_40px_rgba(190,242,100,0.25)]"
          : "text-slate-200 hover:bg-white/10 hover:text-white hover:ring-1 hover:ring-white/10"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        {label}
      </span>
      {isActive ? <span className="h-2 w-2 rounded-full bg-lime-300" /> : null}
    </Link>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:gap-10 md:px-10">
        <aside className="sticky top-6 hidden h-fit w-64 flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 px-5 py-5 shadow-lg md:block">
          <div className="mb-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">KaportaAPP</p>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Kontrol Paneli</h2>
              <span className="rounded-full bg-lime-400/20 px-3 py-1 text-[11px] font-semibold text-lime-100 ring-1 ring-lime-300/30">
                Canlı
              </span>
            </div>
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">KaportaAPP</p>
              <h2 className="text-lg font-semibold">Kontrol Paneli</h2>
            </div>
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-slate-200"
            >
              Dashboard
            </Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
