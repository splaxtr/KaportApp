"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUser } from "@/lib/api/users";

export function PasswordForm({ userId, token }: { userId: string; token: string }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateUser(userId, { password }, token);
      setMessage("Şifre güncellendi");
      setPassword("");
    } catch (err) {
      setMessage("Şifre güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSave} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label>Yeni Şifre</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {message && <div className="text-sm text-muted-foreground">{message}</div>}
      <Button type="submit" disabled={saving || password.length < 6}>
        {saving ? "Kaydediliyor..." : "Şifreyi Güncelle"}
      </Button>
    </form>
  );
}
