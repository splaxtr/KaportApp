// Client layout for navigation highlighting
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";

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
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const hasAuth = document.cookie.includes("kaporta_auth=");
    if (!hasAuth) {
      router.replace("/");
      return;
    }
    const raw = document.cookie.split("; ").find((c) => c.startsWith("kaporta_auth="));
    if (raw) {
      try {
        const parsed = JSON.parse(decodeURIComponent(raw.split("=", 2)[1]));
        setRole(parsed?.role ?? null);
      } catch {
        setRole(null);
      }
    }
  }, [router]);

  const visibleNav = role === "employee" ? navItems.filter((item) => item.href !== "/settings") : navItems;

  const MobileBottomNav = () => {
    const segment = useSelectedLayoutSegment();
    return (
      <nav
        className="fixed bottom-3 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-3xl border border-white/10 bg-[#0c0f1a]/88 px-3 py-2 text-[11px] text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-md md:hidden overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex min-w-max items-center gap-2">
          {visibleNav.map((item) => {
            const isActive = item.href === `/${segment ?? ""}` || (item.href === "/dashboard" && segment === null);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[70px] flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 transition ${
                  isActive ? "text-lime-200" : "text-slate-300 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-[10px] leading-none">{item.label}</span>
                {isActive ? <span className="mt-1 h-0.5 w-6 rounded-full bg-lime-300/80" /> : null}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 pb-24 md:flex-row md:gap-10 md:px-10 md:pb-8">
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
              {visibleNav.map((item) => (
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
            </div>
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
}
