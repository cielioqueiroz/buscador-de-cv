export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`
      bg-slate-200 dark:bg-[#2a3245]
      rounded animate-pulse
      ${className}
    `}></div>
  );
};

export const JobCardSkeleton = () => {
  return (
    <div className="
      rounded-lg p-6
      bg-white dark:bg-[#1e2433]
      border border-slate-200 dark:border-[#2a3245]
      shadow-subtle dark:shadow-xl
    ">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-4 flex-1">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded" />
      </div>
      <div className="flex gap-4 mb-4 flex-wrap">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="h-16 w-full mb-5 rounded" />
      <div className="flex gap-2 flex-wrap mb-4">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-16 rounded" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded" />
        <Skeleton className="h-10 w-12 rounded" />
      </div>
    </div>
  );
};
