import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";

const photos = [
  { title: "Claim photo 1", src: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=400&q=60" },
  { title: "Claim photo 2", src: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=400&q=60" },
];

export default function EmployeePhotos() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Photos</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p) => (
          <Card key={p.title} className="border border-border bg-card">
            <CardHeader className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-foreground">{p.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted/40">
                <Image src={p.src} alt={p.title} fill className="object-cover" sizes="(min-width: 1024px) 30vw, 50vw" />
              </div>
              <p className="text-xs text-muted-foreground">Uploaded recently</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
