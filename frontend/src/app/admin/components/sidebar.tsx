"use client";

import { Building2, Car, LayoutDashboard, ListChecks, UserCog, Users } from "lucide-react";
import { SidebarItem } from "./sidebar-item";
import { MobileSidebar } from "./mobile-sidebar";

export const adminNav = [
  { label: "Panel", href: "/admin", icon: LayoutDashboard },
  { label: "Şubeler", href: "/admin/shops", icon: Building2 },
  { label: "Kullanıcılar", href: "/admin/users", icon: Users },
  { label: "Araçlar", href: "/admin/vehicles", icon: Car },
  { label: "Aktivite Günlüğü", href: "/admin/activity", icon: ListChecks },
  { label: "Yönetici Ayarları", href: "/admin/settings", icon: UserCog },
];

export function Sidebar() {
  return (
    <>
      <MobileSidebar />
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/70 p-4 lg:block">
        <div className="mb-6 text-lg font-semibold text-foreground">Kaporta Admin</div>
        <nav className="space-y-1">
          {adminNav.map((item) => (
            <SidebarItem key={item.href} item={item} />
          ))}
        </nav>
      </aside>
    </>
  );
}
