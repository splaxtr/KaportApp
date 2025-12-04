import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function OwnerSettings() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Shop Settings</h1>
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <div>
              <p className="text-sm text-foreground">Email alerts</p>
              <p className="text-xs text-muted-foreground">Send updates for your shop.</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
