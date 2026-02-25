export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
      <div className="mb-3 h-3 w-24 rounded bg-white/10" />
      <div className="h-8 w-16 rounded bg-white/10" />
      <div className="mt-4 h-1.5 w-full rounded-full bg-white/10" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
      <div className="mb-4 h-5 w-32 rounded bg-white/10" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 flex-1 rounded bg-white/10" />
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-4 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="h-4 w-32 rounded bg-white/10 mb-2" />
        <div className="h-8 w-64 rounded bg-white/10" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton />
    </div>
  );
}
