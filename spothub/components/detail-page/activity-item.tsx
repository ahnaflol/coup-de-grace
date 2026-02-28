"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  FileText,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate, formatDuration } from "@/lib/formatters";
import type { Activity, ActivityType } from "@/types";

const typeConfig: Record<
  ActivityType,
  { icon: typeof Mail; color: string; bg: string }
> = {
  email: { icon: Mail, color: "text-blue-600", bg: "bg-blue-100" },
  call: { icon: Phone, color: "text-green-600", bg: "bg-green-100" },
  note: { icon: FileText, color: "text-amber-600", bg: "bg-amber-100" },
  meeting: { icon: Calendar, color: "text-purple-600", bg: "bg-purple-100" },
  task: { icon: CheckSquare, color: "text-slate-600", bg: "bg-slate-100" },
};

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[activity.type];
  const Icon = config.icon;

  const shouldTruncate = activity.body.length > 150;
  const displayBody =
    shouldTruncate && !expanded
      ? activity.body.slice(0, 150) + "..."
      : activity.body;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            config.bg
          )}
        >
          <Icon className={cn("size-4", config.color)} />
        </div>
        <div className="mt-1 w-px flex-1 bg-border" />
      </div>
      <div className="flex-1 pb-6">
        <p className="font-medium">{activity.title}</p>
        <p className="text-xs text-muted-foreground">
          {activity.performedBy} &middot;{" "}
          {formatRelativeDate(activity.performedAt)}
        </p>
        {activity.body && (
          <div className="mt-1.5">
            <p className="text-sm text-muted-foreground">{displayBody}</p>
            {shouldTruncate && (
              <button
                type="button"
                className="mt-0.5 text-xs font-medium text-primary hover:underline"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
        <ActivityMetadata activity={activity} />
      </div>
    </div>
  );
}

function ActivityMetadata({ activity }: { activity: Activity }) {
  const { type, metadata } = activity;

  if (type === "email" && metadata.direction) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        Direction: {String(metadata.direction)}
      </p>
    );
  }

  if (type === "call" && metadata.duration) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        Duration: {formatDuration(Number(metadata.duration))}
      </p>
    );
  }

  if (type === "meeting" && metadata.attendees) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        Attendees: {String(metadata.attendees)}
      </p>
    );
  }

  return null;
}
