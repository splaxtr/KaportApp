"use client";

import { useRouter } from "next/navigation";
import { User, LogOut, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateUser, getUserDetail } from "@/lib/api/users";
import { jwtDecode } from "jwt-decode";

export function Navbar() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const handleLogout = () => {
    if (typeof document !== "undefined") {
      const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
      document.cookie = `token=; ${expires}`;
      document.cookie = `role=; ${expires}`;
      document.cookie = `shopId=; ${expires}`;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/70 px-6 py-4">
      <div className="text-sm text-muted-foreground">Tekrar hoş geldiniz</div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-border px-2 py-1 hover:bg-muted/60 transition">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">Profil</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Hesap</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Şifre / Ayarlar</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıkış</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
        <PasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      </div>
    </header>
  );
}

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const tokenCookie = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("token="));
  if (tokenCookie) return tokenCookie.split("=")[1];
  const ls = localStorage.getItem("accessToken");
  if (ls) return ls;
  return null;
}

function useCurrentUser() {
  const [state, setState] = useState<{ id: string; token: string; name: string; email: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const decoded = jwtDecode<{ sub?: string }>(token);
      if (!decoded.sub) return;
      getUserDetail(decoded.sub, token)
        .then((u) => {
          setState({ id: decoded.sub!, token, name: u.name, email: u.email });
        })
        .catch(() => null);
    } catch {
      // noop
    }
  }, []);

  return state;
}

function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const me = useCurrentUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setEmail(me.email || "");
    }
  }, [me, open]);

  const save = async () => {
    if (!me) return;
    setSaving(true);
    try {
      await updateUser(me.id, { name, email }, me.token);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profil</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Ad Soyad</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>E-posta</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={save} disabled={saving || !name || !email}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const me = useCurrentUser();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!me) return;
    setSaving(true);
    try {
      await updateUser(me.id, { password }, me.token);
      setPassword("");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Şifre Değiştir</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Yeni Şifre</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={save} disabled={saving || password.length < 6}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
