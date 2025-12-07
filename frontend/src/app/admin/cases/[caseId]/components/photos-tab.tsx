"use client";

import { useState } from "react";
import Image from "next/image";
import { CasePhoto, deleteCasePhoto, uploadCasePhoto } from "@/lib/api/admin/cases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash, Upload, Loader2 } from "lucide-react";

type Props = {
  caseId: string;
  photos: CasePhoto[];
  token: string;
  onRefresh: () => Promise<void>;
};

export function PhotosTab({ caseId, photos, token, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!file) return;
    setLoading(true);
    await uploadCasePhoto(caseId, file, token);
    await onRefresh();
    setLoading(false);
    setOpen(false);
    setFile(null);
  }

  async function handleDelete(id: string) {
    setLoading(true);
    await deleteCasePhoto(id, token);
    await onRefresh();
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0">
        <CardTitle>Fotoğraflar</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Fotoğraf Yükle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fotoğraf Yükle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dosya</Label>
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  İptal
                </Button>
                <Button onClick={submit} disabled={loading || !file}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Yükle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {photos.length === 0 && (
          <p className="text-sm text-muted-foreground">Fotoğraf bulunamadı.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-lg border">
              <Image
                src={photo.url}
                alt="Case photo"
                width={400}
                height={300}
                className="h-48 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/40 via-black/10 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                <span className="text-xs text-white">
                  {photo.takenAt ? new Date(photo.takenAt).toLocaleDateString("tr-TR") : "-"}
                </span>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(photo.id)}
                  disabled={loading}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
