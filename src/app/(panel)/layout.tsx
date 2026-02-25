// Client layout for navigation highlighting
"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";

import { logoutAction } from "@/app/actions/logout";
import NotificationBell from "@/components/NotificationBell";

const navItems = [
  { href: "/dashboard", label: "Özet", icon: "🏁" },
  { href: "/customers", label: "Müşteriler", icon: "👤" },
  { href: "/vehicles", label: "Araçlar", icon: "🚗" },
  { href: "/experts", label: "Eksperler", icon: "🧑‍🔧" },
  { href: "/calendar", label: "Takvim", icon: "📅" },
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
  const [loggingOut, startLogout] = useTransition();

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

  const handleLogout = () => {
    startLogout(async () => {
      try {
        await logoutAction();
      } catch (error) {
        console.error("Logout failed", error);
      } finally {
        setRole(null);
        router.replace("/");
        router.refresh();
      }
    });
  };

  const roleLabel =
    role === "system_admin"
      ? "Sistem admini"
      : role === "admin"
        ? "Yönetici"
        : role === "employee"
          ? "Personel"
          : "Oturum açık";

  const LogoutButton = ({ compact = false }: { compact?: boolean }) => (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className={`rounded-lg border border-white/15 bg-white/10 text-xs font-semibold text-slate-50 transition hover:border-lime-300/70 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70 ${
        compact ? "px-3 py-2" : "px-4 py-2"
      }`}
    >
      {loggingOut ? "Çıkış yapılıyor..." : "Çıkış yap"}
    </button>
  );

  const visibleNav = role === "employee" ? navItems.filter((item) => item.href !== "/settings") : navItems;

  const MobileBottomNav = () => {
    const segment = useSelectedLayoutSegment();
    return (
      <nav
        aria-label="Mobil menü"
        className="fixed bottom-3 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-3xl border border-white/10 bg-[#0c0f1a]/88 px-3 py-2 text-[11px] text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-md md:hidden overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex min-w-max items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-w-[70px] flex-col items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-slate-50 ring-1 ring-lime-300/50 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="text-base">⏻</span>
            <span className="text-[10px] leading-none">{loggingOut ? "Çıkılıyor" : "Çıkış"}</span>
          </button>
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

  const MobileFloatingLogout = () => (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-lime-400 to-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_40px_rgba(74,222,128,0.45)] transition hover:scale-[1.02] md:hidden disabled:cursor-not-allowed disabled:opacity-75"
    >
      <span className="text-base">⏻</span>
      {loggingOut ? "Çıkış yapılıyor..." : "Çıkış yap"}
    </button>
  );

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
            <nav aria-label="Ana menü" className="space-y-1.5">
              {visibleNav.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
              ))}
            </nav>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-inner">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Oturum</p>
                  <p className="text-sm font-semibold text-white">{roleLabel}</p>
                  <p className="text-xs text-slate-400">KaportaAPP erişimi</p>
                </div>
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <LogoutButton />
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-4 flex items-center justify-between md:hidden">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">KaportaAPP</p>
                <h2 className="text-lg font-semibold">Kontrol Paneli</h2>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <LogoutButton compact />
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
      <MobileFloatingLogout />
      <MobileBottomNav />
    </>
  );
}
