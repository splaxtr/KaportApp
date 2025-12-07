import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { normalizePlate } from "@/lib/plate";
import FileListClient from "./FileListClient";
import FileCreateDialog from "./FileCreateDialog";

type FileRow = {
  id: number;
  plate: string;
  brandModel: string;
  customer: { id: number; fullName: string };
  status: string;
  quickNote: string | null;
  updatedAt: string;
  fileNumber?: string | null;
  accidentDate?: string | null;
};

const statusStyles: Record<string, string> = {
  open: "bg-sky-400 text-slate-950",
  pending: "bg-amber-300 text-slate-950",
  completed: "bg-lime-400 text-slate-950",
};

const statusLabels: Record<string, string> = {
  open: "Açık",
  pending: "Beklemede",
  completed: "Tamamlandı",
};

function formatDate(date: string | null | undefined) {
  if (!date) return "Devam ediyor";
  return new Date(date).toLocaleDateString("tr-TR");
}

async function fetchFiles(plate: string): Promise<FileRow[]> {
  const normalized = normalizePlate(plate);
  if (!normalized) return [];

  const data = await prisma.vehicleFile.findMany({
    where: {
      deletedAt: null,
      vehicle: { plateNormalized: normalized },
    },
    include: {
      vehicle: true,
      customer: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return data.map((f) => ({
    id: f.id,
    plate: f.vehicle.plate,
    brandModel: f.brandModel,
    customer: { id: f.customer.id, fullName: f.customer.fullName },
    status: f.status,
    quickNote: f.quickNote,
    updatedAt: f.updatedAt.toISOString(),
    fileNumber: f.fileNumber,
    accidentDate: f.accidentDate ? f.accidentDate.toISOString() : null,
  }));
}

export default async function VehicleFilesDetail({ params }: { params: Promise<{ plate: string }> }) {
  const { plate } = await params;
  const decodedPlate = decodeURIComponent(plate).toUpperCase();
  const files = await fetchFiles(decodedPlate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Araç Dosyaları</p>
          <h1 className="text-3xl font-semibold">Plaka: {decodedPlate}</h1>
          <p className="text-sm text-slate-300">Bu araca ait dosyalar, durum ve notlar.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/vehicles"
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
          >
            Geri dön
          </Link>
          <FileCreateDialog plate={decodedPlate} />
        </div>
      </div>

      <FileListClient files={files} />
    </div>
  );
}
