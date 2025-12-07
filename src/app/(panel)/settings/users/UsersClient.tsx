"use client";

import { FormEvent, useEffect, useState } from "react";

type User = { id: number; fullName: string; email: string; phone: string | null; role: string; createdAt: string };
type Role = { key: string; name: string };

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", roleKey: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [uRes, rRes] = await Promise.all([fetch("/api/users", { cache: "no-store" }), fetch("/api/roles", { cache: "no-store" })]);
      if (!uRes.ok) throw new Error("Kullanıcılar alınamadı");
      if (!rRes.ok) throw new Error("Roller alınamadı");
      setUsers(await uRes.json());
      const roleData = await rRes.json();
      setRoles(roleData.map((r: any) => ({ key: r.key, name: r.name })));
      if (!form.roleKey && roleData.length > 0) {
        setForm((f) => ({ ...f, roleKey: roleData[0].key }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ fullName: "", email: "", phone: "", password: "", roleKey: roles[0]?.key ?? "" });
    setShowModal(true);
    setError(null);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || (!editingId && !form.password.trim()) || !form.roleKey) {
      setError("Ad soyad, e-posta, rol zorunlu. Yeni kayıt için şifre girin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        roleKey: form.roleKey,
      };
      if (!editingId) payload.password = form.password;
      const res = await fetch(editingId ? `/api/users/${editingId}` : "/api/users", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Kaydedilemedi");
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setForm({ fullName: user.fullName, email: user.email, phone: user.phone ?? "", password: "", roleKey: user.role });
    setShowModal(true);
    setError(null);
  }

  async function removeUser(id: number) {
    if (!confirm("Kullanıcı silinsin mi?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ayarlar</p>
        <h1 className="text-3xl font-semibold text-white">Kullanıcılar ve Roller</h1>
        <p className="text-sm text-slate-300">Kullanıcı ekle, rol ataması yap ve yönet.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      <div className="flex justify-between items-center">
        <div />
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg border border-lime-300/60 bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]"
        >
          Yeni kullanıcı
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-slate-300">Yükleniyor...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3">Ad Soyad</th>
                <th className="px-4 py-3">E-posta</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Oluşturma</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-300">
                    Kullanıcı yok.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{u.fullName}</td>
                    <td className="px-4 py-3 text-slate-200">{u.email}</td>
                    <td className="px-4 py-3 text-slate-200">{u.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-200">{u.role}</td>
                    <td className="px-4 py-3 text-slate-200">{new Date(u.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="rounded-md border border-white/15 px-3 py-1 text-slate-200 hover:border-lime-300/70 hover:text-white"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => removeUser(u.id)}
                          className="rounded-md border border-red-500/50 px-3 py-1 text-red-200 hover:bg-red-500/10"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#0f0f14] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Kullanıcı</p>
                <h3 className="text-xl font-semibold text-white">{editingId ? "Kullanıcıyı düzenle" : "Yeni kullanıcı"}</h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-lime-300/60 hover:text-white"
              >
                Kapat
              </button>
            </div>
            <form className="space-y-3" onSubmit={save}>
              <input
                type="text"
                placeholder="Ad Soyad"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="E-posta"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                required
                disabled={!!editingId}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Telefon (ops.)"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                />
                <select
                  value={form.roleKey}
                  onChange={(e) => setForm((f) => ({ ...f, roleKey: e.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white focus:border-lime-300/70 focus:outline-none"
                  required
                >
                  {roles.map((r) => (
                    <option key={r.key} value={r.key} className="bg-[#0f0f14] text-white">
                      {r.name} ({r.key})
                    </option>
                  ))}
                </select>
              </div>
              {!editingId ? (
                <input
                  type="password"
                  placeholder="Şifre"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lime-300/70 focus:outline-none"
                  required
                />
              ) : null}
              {error ? (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>
              ) : null}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  className="rounded-md border border-white/15 px-3 py-2 text-xs text-slate-200 hover:border-lime-300/70 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md border border-lime-500 bg-lime-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)] disabled:opacity-70"
                >
                  {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
