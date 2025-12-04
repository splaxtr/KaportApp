import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
};

export function QuickActionCard({ title, description, icon: Icon, href = "#", onClick }: QuickActionCardProps) {
  const body = (
    <Card
      className={cn(
        "group h-full cursor-pointer rounded-xl border border-border bg-card p-5 shadow-[0_0_18px_-8px_rgba(0,0,0,0.4)] transition",
        "hover:-translate-y-[2px] hover:scale-[1.02] hover:bg-card/90 hover:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.5)]"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary transition group-hover:bg-primary/20">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );

  if (href && href !== "#") {
    return (
      <Link href={href} className="h-full">
        {body}
      </Link>
    );
  }

  return body;
}
