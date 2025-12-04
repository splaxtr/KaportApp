"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Sidebar() {
  const pathname = usePathname();
  const content = (
    <div className="flex h-full flex-col border-r border-border bg-card/70 p-4">
      <div className="mb-6 text-lg font-semibold text-foreground">Kaporta Admin</div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <div className="hidden w-64 shrink-0 lg:block">{content}</div>
      <div className="lg:hidden border-b border-border bg-card/70 px-4 py-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="h-4 w-4" />
              <span className="ml-2">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            {content}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
