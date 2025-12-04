import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";

const vehicles = [
  { plate: "34EMP001", model: "Peugeot 3008", status: "Photo upload pending" },
  { plate: "34EMP002", model: "Fiat Egea", status: "Awaiting parts" },
];

export default function EmployeeVehicles() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">My Vehicles</h1>
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
