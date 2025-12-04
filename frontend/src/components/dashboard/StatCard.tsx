import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  updatedAt?: string;
  accentClass?: string;
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  updatedAt = "Şimdi güncellendi",
  accentClass = "text-muted-foreground"
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border bg-card transition hover:-translate-y-[1px] hover:bg-card/90 hover:shadow-lg"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
      <CardHeader className="relative pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("absolute right-4 top-4 h-5 w-5 opacity-80", accentClass)} />
      </CardHeader>
      <CardContent className="relative space-y-2">
        <div className="text-4xl font-bold tracking-tight text-foreground">{value}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{updatedAt}</span>
          {trend ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">{trend}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
