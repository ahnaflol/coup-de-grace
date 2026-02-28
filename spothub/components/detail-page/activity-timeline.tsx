"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityItem } from "@/components/detail-page/activity-item";
import type { Activity, ActivityType } from "@/types";

const filterTabs: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Emails", value: "email" },
  { label: "Calls", value: "call" },
  { label: "Notes", value: "note" },
  { label: "Meetings", value: "meeting" },
];

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading: boolean;
}

export function ActivityTimeline({
  activities,
  isLoading,
}: ActivityTimelineProps) {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? activities
      : activities.filter((a) => a.type === (filter as ActivityType));

  return (
    <div>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList variant="line">
          {filterTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Loading activities...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No activities found
          </div>
        ) : (
          <div>
            {filtered.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
