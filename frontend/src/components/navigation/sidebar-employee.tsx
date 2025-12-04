"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Car, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/employee", label: "Overview", icon: Activity },
  { href: "/employee/vehicles", label: "Vehicles", icon: Car },
  { href: "/employee/photos", label: "Photos", icon: ImageIcon },
];

export function SidebarEmployee() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/70 p-4 lg:block">
      <div className="mb-6 text-lg font-semibold text-foreground">Kaporta Employee</div>
      <nav className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
