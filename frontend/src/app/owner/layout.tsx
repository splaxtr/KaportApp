import { ReactNode } from "react";
import { SidebarOwner } from "@/components/navigation/sidebar-owner";
import { Navbar } from "@/components/layout/Navbar";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarOwner />
      <div className="flex flex-1 flex-col bg-background">
        <Navbar />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
