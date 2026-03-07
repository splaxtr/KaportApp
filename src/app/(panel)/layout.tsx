// Client layout for navigation highlighting
"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
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

// The 5 primary items for the mobile bottom nav
const mobileNavPrimary = [
  { href: "/dashboard", label: "Özet", icon: "🏁" },
  { href: "/vehicles", label: "Araçlar", icon: "🚗" },
  { href: "/calendar", label: "Takvim", icon: "📅" },
  { href: "/customers", label: "Müşteriler", icon: "👤" },
  { href: "/settings", label: "Ayarlar", icon: "⚙️" },
];

// Secondary items accessible via the "Daha" overflow menu
const mobileNavSecondary = [
  { href: "/experts", label: "Eksperler", icon: "🧑‍🔧" },
  { href: "/review-links", label: "Sigorta İnceleme", icon: "🔗" },
  { href: "/trash", label: "Silinenler", icon: "🗑️" },
];

type NavItem = { href: string; label: string; icon: string };

function NavLink({ href, label, icon }: NavItem) {
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

function MobileBottomNav({
  primaryItems,
  secondaryItems,
  onLogout,
  loggingOut,
}: {
  primaryItems: NavItem[];
  secondaryItems: NavItem[];
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const segment = useSelectedLayoutSegment();
  const [moreOpen, setMoreOpen] = useState(false);

  // Check if any secondary item is active
  const secondaryActive = secondaryItems.some(
    (item) => item.href === `/${segment ?? ""}`,
  );

  return (
    <>
      <nav
        aria-label="Mobil menü"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0c0f1a]/95 backdrop-blur-lg md:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-1 py-1.5">
          {primaryItems.map((item) => {
            const isActive =
              item.href === `/${segment ?? ""}` || (item.href === "/dashboard" && segment === null);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition ${
                  isActive
                    ? "bg-white/10 text-lime-300 ring-1 ring-lime-300/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* "Daha" overflow button */}
          {secondaryItems.length > 0 && (
            <div className="flex flex-1 flex-col items-center">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex w-full flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition ${
                  moreOpen || secondaryActive
                    ? "bg-white/10 text-lime-300 ring-1 ring-lime-300/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="text-xl leading-none">···</span>
                <span className="text-[10px] font-medium leading-tight">Daha</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Popup rendered OUTSIDE nav to avoid backdrop-filter clipping on mobile Safari */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-[45] md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-16 right-3 z-50 min-w-[180px] rounded-xl border border-white/10 bg-[#0c0f1a] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] md:hidden">
            {secondaryItems.map((item) => {
              const isActive = item.href === `/${segment ?? ""}`;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-white/10 text-lime-300 ring-1 ring-lime-300/40"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}

            {/* Logout inside overflow menu */}
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onLogout();
              }}
              disabled={loggingOut}
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-white/5 px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="text-base">⏻</span>
              {loggingOut ? "Çıkış yapılıyor..." : "Çıkış yap"}
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loggingOut, startLogout] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) {
          router.replace("/");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.role) setRole(data.role);
        if (data?.email) setEmail(data.email);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        router.replace("/");
      });
    return () => controller.abort();
  }, [router]);

  const handleLogout = useCallback(() => {
    startLogout(async () => {
      try {
        await logoutAction();
      } catch (error) {
        console.error("Logout failed", error);
      } finally {
        setRole(null);
        setEmail(null);
        router.replace("/");
        router.refresh();
      }
    });
  }, [router]);

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

  const visibleMobilePrimary =
    role === "employee" ? mobileNavPrimary.filter((item) => item.href !== "/settings") : mobileNavPrimary;

  const visibleMobileSecondary =
    role === "employee" ? mobileNavSecondary : mobileNavSecondary;

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 pb-20 md:flex-row md:gap-10 md:px-10 md:pb-8">
          <aside className="sticky top-6 hidden h-fit w-64 flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 px-5 py-5 shadow-lg md:block">
            <div className="mb-6 space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">KaportaAPP</p>
              <h2 className="text-lg font-semibold">Kontrol Paneli</h2>
            </div>
            <nav aria-label="Ana menü" className="space-y-1.5">
              {visibleNav.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
              ))}
            </nav>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-inner">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Oturum</p>
                  <p className="text-sm font-semibold text-white">{roleLabel}</p>
                  <p className="truncate text-xs text-slate-400" title={email ?? undefined}>
                    {email ?? "KaportaAPP erişimi"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <NotificationBell />
                  <LogoutButton />
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">KaportaAPP</p>
                <h2 className="text-base font-semibold leading-tight">Kontrol Paneli</h2>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <NotificationBell />
                <LogoutButton compact />
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav
        primaryItems={visibleMobilePrimary}
        secondaryItems={visibleMobileSecondary}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
    </>
  );
}
