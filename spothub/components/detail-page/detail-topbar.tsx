import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailTopbarProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  backHref: string;
  actions?: ReactNode;
}

export function DetailTopbar({
  title,
  subtitle,
  badge,
  backHref,
  actions,
}: DetailTopbarProps) {
  return (
    <div className="flex items-center gap-4 border-b bg-white px-6 py-4">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href={backHref}>
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
