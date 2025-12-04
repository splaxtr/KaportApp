"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRow, updateUser } from "@/lib/api/users";

export function ProfileForm({ user, token }: { user: UserRow; token: string }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateUser(user.id, { name, email }, token);
      setMessage("Kaydedildi");
    } catch (err) {
      setMessage("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="space-y-2">
        <Label>Ad Soyad</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>E-posta</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {message && <div className="text-sm text-muted-foreground">{message}</div>}
      <Button type="submit" disabled={saving}>
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
