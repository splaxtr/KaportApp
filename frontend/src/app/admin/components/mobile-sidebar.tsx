"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { adminNav } from "./sidebar";
import { SidebarItem } from "./sidebar-item";
import { useEffect, useState } from "react";

export function MobileSidebar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="lg:hidden border-b border-border bg-card/70 px-4 py-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Menu className="h-4 w-4" />
            Menu
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="flex h-full flex-col border-r border-border bg-card/70 p-4">
            <div className="mb-6 text-lg font-semibold text-foreground">Kaporta Admin</div>
            <nav className="space-y-1">
              {adminNav.map((item) => (
                <SidebarItem key={item.href} item={item} />
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
