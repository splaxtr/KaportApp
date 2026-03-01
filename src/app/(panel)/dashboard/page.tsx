import { Suspense } from "react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { CardSkeleton, TableSkeleton } from "@/components/LoadingSkeleton";
import DashboardCharts from "./DashboardCharts";

export const revalidate = 0;

function formatDate(date?: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("tr-TR");
}

async function StatsSection() {
  const [openFiles, pendingParts, ongoingOps, readyFiles] = await Promise.all([
    prisma.vehicleFile.count({ where: { deletedAt: null, status: "open" } }),
    prisma.part.count({
      where: { deletedAt: null, status: { label: { contains: "bekle", mode: "insensitive" } } },
    }),
    prisma.operation.count({
      where: {
        deletedAt: null,
        status: { label: { not: "Tamamlandı" } },
      },
    }),
    prisma.vehicleFile.count({ where: { deletedAt: null, status: "completed" } }),
  ]);

  const stats = [
    { label: "Açık dosya", value: openFiles, accent: "from-lime-300 to-green-500", change: "Anlık" },
    { label: "Bekleyen parça", value: pendingParts, accent: "from-amber-300 to-orange-500", change: "Anlık" },
    { label: "Aktif işlem", value: ongoingOps, accent: "from-sky-300 to-blue-500", change: "Anlık" },
    { label: "Teslime hazır", value: readyFiles, accent: "from-emerald-300 to-teal-500", change: "Anlık" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg ring-1 ring-white/5 transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(148,163,184,0.25)]"
        >
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-white">{stat.value}</span>
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200">{stat.change}</span>
          </div>
          <div className={`mt-4 h-1.5 rounded-full bg-gradient-to-r ${stat.accent}`} />
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

async function RecentOpsSection() {
  const recentOps = await prisma.operation.findMany({
    where: { deletedAt: null },
    include: {
      vehicleFile: { include: { vehicle: true, customer: true } },
      status: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Akış</p>
          <h3 className="text-xl font-semibold text-white">Son işlemler</h3>
        </div>
        <span className="rounded-full bg-lime-400/20 px-3 py-1 text-xs text-lime-200 ring-1 ring-lime-300/30">
          Canlı
        </span>
      </div>
      <div className="space-y-3">
        {recentOps.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Henüz işlem yok.</div>
        ) : (
          recentOps.map((item: { id: number; vehicleFile?: { vehicle: { plate: string }; brandModel: string; customer: { fullName: string } }; title: string; status?: { label: string } | null; createdAt: Date }) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner transition hover:border-lime-300/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {item.vehicleFile?.vehicle.plate} • {item.vehicleFile?.brandModel}
                  </p>
                  <p className="text-xs text-slate-300">{item.title}</p>
                  <p className="text-[11px] text-slate-400">
                    Müşteri: {item.vehicleFile?.customer.fullName ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100">
                    {item.status?.label ?? "—"}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

async function AlertsSection() {
  const alerts = await prisma.part.findMany({
    where: { deletedAt: null, status: { label: { contains: "bekle", mode: "insensitive" } } },
    include: { vehicleFile: { include: { vehicle: true } }, status: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bildirimler</p>
          <h3 className="text-lg font-semibold text-white">Aksiyon gerekli</h3>
        </div>
      </div>
      <div className="space-y-3 text-sm text-slate-200">
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300">Bekleyen uyarı yok.</div>
        ) : (
          alerts.map((alert: { id: number; vehicleFile?: { vehicle: { plate: string } }; name: string; status?: { label: string } | null; vehicleFileId: number; createdAt: Date }) => (
            <div
              key={alert.id}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 ring-1 ring-white/5"
            >
              <p className="font-semibold text-white">
                {alert.vehicleFile?.vehicle.plate} • {alert.name}
              </p>
              <p className="text-xs text-slate-300">Durum: {alert.status?.label ?? "—"}</p>
              <p className="text-[11px] text-slate-400">
                Dosya #{alert.vehicleFileId} • {formatDate(alert.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
      <div className="mt-2 border-t border-white/10 pt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Kısayollar</p>
        <div className="space-y-2 text-sm text-slate-200">
          <Link
            href="/customers"
            className="block w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:border-lime-300/70 hover:bg-white/15"
          >
            Yeni müşteri ekle
          </Link>
          <Link
            href="/vehicles"
            className="block w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:border-lime-300/70 hover:bg-white/15"
          >
            Araç dosyası aç
          </Link>
          <Link
            href="/experts"
            className="block w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:border-lime-300/70 hover:bg-white/15"
          >
            Eksper ataması
          </Link>
          <Link
            href="/review-links"
            className="block w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:border-lime-300/70 hover:bg-white/15"
          >
            Sigorta inceleme linki üret
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-lime-400/10 p-6 shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-200">Kontrol Paneli</p>
            <h1 className="text-3xl font-semibold text-white">Güncel operasyon özeti</h1>
            <p className="text-sm text-slate-200">KaportaAPP • Güvenli erişim</p>
          </div>
        </div>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">Grafikler</h2>
        <DashboardCharts />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Suspense fallback={<TableSkeleton rows={6} />}>
          <RecentOpsSection />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <AlertsSection />
        </Suspense>
      </div>
    </div>
  );
}
