function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />;
}

export function HoldingRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 shrink-0" />
        <div className="space-y-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
  );
}

export function StockRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 shrink-0" />
        <div className="space-y-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-28 h-3" />
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-12 h-6 rounded-full" />
      </div>
    </div>
  );
}
