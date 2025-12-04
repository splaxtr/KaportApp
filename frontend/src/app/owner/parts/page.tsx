import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wrench } from "lucide-react";

const parts = [
  { name: "Front Bumper", status: "Painted" },
  { name: "Headlight Left", status: "Ordered" },
];

export default function OwnerParts() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parts</h1>
          <p className="text-sm text-muted-foreground">Manage your shop parts</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Part
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parts.map((p) => (
          <Card key={p.name} className="border border-border bg-card">
            <CardHeader className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-foreground">{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Status: <span className="text-foreground">{p.status}</span></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
