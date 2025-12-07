import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { normalizePlate } from "@/lib/plate";
import { FileTabs } from "./FileTabs";

type FileData = {
  plate: string;
  customer: string;
  brandModel: string;
  fileNumber: string;
  accidentDate: string | null;
  completedAt: string | null;
  status: string;
  quickNote?: string | null;
};

type PartData = { id: number; name: string; quantity: number; status: string };
type OperationData = { id: number; title: string; status: string; note?: string | null };
type PhotoData = { id: number; title?: string | null; url: string; note?: string | null };

async function getFile(plateParam: string, fileIdParam: string) {
  const normalizedPlate = normalizePlate(plateParam);
  const fileId = Number(fileIdParam);
  if (!normalizedPlate || Number.isNaN(fileId)) return null;

  const file = await prisma.vehicleFile.findFirst({
    where: {
      id: fileId,
      deletedAt: null,
      vehicle: { plateNormalized: normalizedPlate },
    },
    include: {
      vehicle: true,
      customer: true,
    },
  });

  if (!file) return null;

  const fileData: FileData = {
    plate: file.vehicle.plate,
    customer: file.customer.fullName,
    brandModel: file.brandModel,
    fileNumber: file.fileNumber ?? String(file.id),
    accidentDate: file.accidentDate ? file.accidentDate.toISOString() : null,
    completedAt: null,
    status: file.status,
    quickNote: file.quickNote,
  };

  return {
    file: fileData,
    parts: [] as PartData[], // parts client fetch edecek
    operations: [] as OperationData[],
    photos: [] as PhotoData[],
  };
}

export default async function VehicleFileDetail({
  params,
}: {
  params: Promise<{ plate: string; fileId: string }>;
}) {
  const { plate, fileId } = await params;
  const decodedPlate = decodeURIComponent(plate).toUpperCase();
  const decodedFileId = decodeURIComponent(fileId);

  const data = await getFile(decodedPlate, decodedFileId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dosya detayları</p>
          <h1 className="text-3xl font-semibold">
            Plaka: {decodedPlate} • Dosya No: {decodedFileId}
          </h1>
          <p className="text-sm text-slate-300">Özet, parça listesi, işlemler ve fotoğraflar.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/vehicles/${encodeURIComponent(decodedPlate)}`}
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200 hover:border-lime-300/70 hover:text-white"
          >
            Dosyalara dön
          </Link>
          <button className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:shadow-[0_10px_30px_rgba(190,242,100,0.35)]">
            Düzenle
          </button>
        </div>
      </div>

      {data ? (
        <FileTabs fileId={Number(decodedFileId)} file={data.file} initialParts={data.parts} operations={data.operations} photos={data.photos} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
          Dosya bulunamadı.
        </div>
      )}
    </div>
  );
}
