import { TableSkeleton } from "@/components/LoadingSkeleton";

export default function VehiclesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded bg-white/10" />
        <div className="h-10 w-32 rounded-lg bg-white/10" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
