import { Skeleton } from "@/components/ui/skeleton";

const ROW_WIDTHS = [
  ["w-32", "w-48", "w-24", "w-36", "w-20", "w-28"],
  ["w-36", "w-40", "w-28", "w-32", "w-24", "w-20"],
  ["w-28", "w-44", "w-20", "w-40", "w-28", "w-32"],
  ["w-40", "w-36", "w-32", "w-24", "w-20", "w-28"],
  ["w-32", "w-48", "w-28", "w-36", "w-24", "w-24"],
  ["w-36", "w-40", "w-24", "w-32", "w-28", "w-20"],
  ["w-28", "w-44", "w-32", "w-40", "w-20", "w-32"],
  ["w-40", "w-36", "w-20", "w-24", "w-24", "w-28"],
  ["w-32", "w-48", "w-28", "w-36", "w-28", "w-20"],
  ["w-36", "w-40", "w-24", "w-32", "w-20", "w-32"],
];

export function LoadingSkeleton() {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-4 border-b pb-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {ROW_WIDTHS.map((widths, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 py-2">
          {widths.map((width, colIndex) => (
            <Skeleton key={colIndex} className={`h-4 ${width}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
