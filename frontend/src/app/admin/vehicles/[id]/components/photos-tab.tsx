"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhotoRow, deletePhoto } from "@/lib/api/photos";
import { uploadVehiclePhoto } from "@/lib/api/vehicles";
import { useRouter } from "next/navigation";
import { VehicleRow } from "@/lib/api/vehicles";

export function PhotosTab({
  photos,
  token,
  vehicle,
  caseId,
  shopId,
}: {
  photos: PhotoRow[];
  token: string;
  vehicle: VehicleRow;
  caseId?: string | null;
  shopId?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const onDelete = async (id: string) => {
    try {
      await deletePhoto(id, token);
      router.refresh();
    } catch {
      // ignore
    }
  };

  const onUpload = async (file?: File | null) => {
    if (!file || !shopId || !caseId) return;
    setUploading(true);
    try {
      await uploadVehiclePhoto(token, { file, shopId, caseId });
      router.refresh();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">Fotoğraflar ({photos?.length || 0})</div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0] || null)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || !caseId || !shopId}
          >
            {uploading ? "Yükleniyor..." : caseId && shopId ? "Yükle" : "Önce dosya seçin"}
          </Button>
        </div>
      </div>
      {(!photos || photos.length === 0) && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Fotoğraf yok.</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="relative aspect-video w-full bg-muted/40">
              <img
                src={photo.url.startsWith("http") ? photo.url : `${apiBase}${photo.url}`}
                alt="Vehicle photo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
              <span>{photo.takenAt ? new Date(photo.takenAt).toLocaleDateString() : "-"}</span>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(photo.id)}>
                Sil
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
