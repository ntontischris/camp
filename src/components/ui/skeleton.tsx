import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-8 w-16" />
      </td>
    </tr>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-4 py-3 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="px-4 py-3 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="px-4 py-3 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[...Array(rows)].map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function ScheduleGridSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
        <div className="px-4 py-3">
          <Skeleton className="h-4 w-16" />
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="px-4 py-3 text-center">
            <Skeleton className="h-4 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>
        ))}
      </div>

      {/* Rows */}
      {[...Array(6)].map((_, rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-8 border-b border-gray-200">
          <div className="px-4 py-4 bg-gray-50">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          {[...Array(7)].map((_, colIdx) => (
            <div key={colIdx} className="p-2">
              <Skeleton className="h-12 w-full rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
