"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Lock, LogIn, Mail, Shield } from "lucide-react";
import { useEffect } from "react";

type Decoded = { role?: "admin" | "owner" | "employee"; shopId?: string | null };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const match = (name: string) => {
      const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
      return m ? decodeURIComponent(m[2]) : null;
    };
    const role = match("role");
    if (match("token") && role) {
      if (role === "admin") router.replace("/admin");
      else if (role === "owner") router.replace("/owner");
      else if (role === "employee") router.replace("/employee");
    }
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error("Invalid credentials");
      }
      const data = await res.json();
      const token: string = data.accessToken;
      const decoded = jwtDecode<Decoded>(token);
      const role = decoded.role || data.user?.role || "employee";
      const shopId = decoded.shopId || data.user?.shopId || "";

      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
      if (shopId) {
        document.cookie = `shopId=${shopId}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }

      if (role === "admin") router.push("/admin");
      else if (role === "owner") router.push("/owner");
      else router.push("/employee");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black px-4 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,224,255,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(20,96,255,0.14),transparent_30%)]" />
      <Card className="relative w-full max-w-md border border-white/10 bg-white/5 backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl text-white">KaportaAPP</CardTitle>
          <p className="text-sm text-slate-300">Giriş yap ve rolüne göre yönlendirilelim.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-200">E-posta</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="admin@demo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Parola</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş yap"}
              <LogIn className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
