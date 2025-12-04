import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Car } from "lucide-react";

const vehicles = [
  { plate: "34OWN001", model: "Audi A3", status: "In Progress" },
  { plate: "34OWN002", model: "Renault Megane", status: "Waiting Parts" },
];

export default function OwnerVehicles() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Shop Vehicles</h1>
          <p className="text-sm text-muted-foreground">Only your shop&apos;s vehicles.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => (
          <Card key={v.plate} className="border border-border bg-card">
            <CardHeader className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-foreground">{v.plate}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div>{v.model}</div>
              <div className="text-foreground">Status: {v.status}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
