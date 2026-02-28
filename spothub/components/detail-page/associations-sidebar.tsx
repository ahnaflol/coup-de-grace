"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AssociationItem {
  id: string;
  name: string;
  subtitle: string;
  href: string;
}

interface AssociationGroup {
  type: string;
  items: AssociationItem[];
}

interface AssociationsSidebarProps {
  associations: AssociationGroup[];
}

export function AssociationsSidebar({
  associations,
}: AssociationsSidebarProps) {
  return (
    <div className="space-y-3">
      {associations.map((group) => (
        <AssociationSection key={group.type} group={group} />
      ))}
    </div>
  );
}

function AssociationSection({ group }: { group: AssociationGroup }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleItems =
    showAll || group.items.length <= 3
      ? group.items
      : group.items.slice(0, 3);

  return (
    <Card className="gap-2 py-3">
      <CardHeader className="px-4 pb-0">
        <button
          type="button"
          className="flex w-full items-center gap-1.5"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
          <CardTitle className="text-sm">
            {group.type} ({group.items.length})
          </CardTitle>
        </button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-1.5 px-4">
          {visibleItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-md border p-2 transition-colors hover:bg-accent"
            >
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </Link>
          ))}
          {group.items.length > 3 && !showAll && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowAll(true)}
            >
              View all ({group.items.length})
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
