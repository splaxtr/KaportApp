import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock3, LucideIcon } from "lucide-react";

type ActivityItemProps = {
  message: string;
  timestamp: string;
  icon: LucideIcon;
  badge?: string;
  className?: string;
};

export function ActivityItem({ message, timestamp, icon: Icon, badge, className }: ActivityItemProps) {
  return (
    <div className={cn("relative pl-10", className)}>
      <div className="absolute left-4 top-0 h-full w-px bg-slate-700/80" />
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-[0_0_12px_-8px_rgba(0,0,0,0.5)]">
        <div className="mt-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-2 ring-border" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{message}</p>
            {badge ? (
              <Badge variant="outline" className="text-[11px]">
                {badge}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            <span>{timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
