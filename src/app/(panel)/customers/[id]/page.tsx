import { notFound } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import CustomerEdit from "./CustomerEdit";

type Params = { params: Promise<{ id: string }> };

async function getCustomer(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;

  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      phones: { where: { deletedAt: null } },
      addresses: { where: { deletedAt: null } },
      notes: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      files: {
        where: { deletedAt: null },
        select: {
          id: true,
          brandModel: true,
          status: true,
          vehicle: { select: { plate: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!customer) return null;
  return customer;
}

export default async function CustomerDetail({ params }: Params) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Müşteri</p>
          <h1 className="text-3xl font-semibold">{customer.fullName}</h1>
          <p className="text-sm text-slate-300">İletişim bilgileri, adres ve son dosyalar.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/customers"
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
          >
            Listeye dön
          </Link>
          <CustomerEdit
            customer={{
              id: customer.id,
              fullName: customer.fullName,
              email: customer.email,
              tcVkn: customer.tcVkn,
              phones: customer.phones.map((p) => p.phone),
              address: customer.addresses[0]?.address ?? "",
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">İletişim</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-400">E-posta</p>
              <p className="text-white">{customer.email ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-400">Telefon</p>
              <p className="text-white">
                {customer.phones.length > 0 ? customer.phones.map((p) => p.phone).join(" / ") : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
              <p className="text-sm text-slate-400">Adresler</p>
              <div className="space-y-1 text-white">
                {customer.addresses.length === 0
                  ? "—"
                  : customer.addresses.map((a) => (
                      <p key={a.id} className="text-sm text-slate-200">
                        {a.address}
                      </p>
                    ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Araç dosyaları</p>
          {customer.files.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">Bu müşteri için dosya yok.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              {customer.files.map((f) => (
                <Link
                  key={f.id}
                  href={`/vehicles/${encodeURIComponent(f.vehicle.plate)}/${f.id}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:border-lime-300/70 hover:text-white"
                >
                  <div>
                    <p className="font-semibold text-white">{f.vehicle.plate}</p>
                    <p className="text-xs text-slate-300">{f.brandModel}</p>
                  </div>
                  <span className="text-xs uppercase text-slate-300">{f.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Notlar</p>
        <div className="mt-3 space-y-2 text-sm text-slate-200">
          {customer.notes.length === 0 ? (
            <p className="text-slate-300">Not bulunmuyor.</p>
          ) : (
            customer.notes.map((n) => (
              <div key={n.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p>{n.note}</p>
                <p className="text-[11px] text-slate-400">
                  {new Date(n.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
