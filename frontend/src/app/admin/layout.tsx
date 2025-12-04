import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "./components/sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Navbar />
          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
