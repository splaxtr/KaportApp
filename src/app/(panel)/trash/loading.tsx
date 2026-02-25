import { TableSkeleton } from "@/components/LoadingSkeleton";

export default function TrashLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 rounded bg-white/10" />
      <TableSkeleton rows={6} />
    </div>
  );
}
