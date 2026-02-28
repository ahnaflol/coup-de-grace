"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  Ticket,
  Upload,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Deals", href: "/deals", icon: DollarSign },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Import", href: "/import", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col bg-slate-900 text-white">
      <div className="px-5 py-5">
        <h1 className="text-xl font-bold">
          <span className="text-orange-500">Spot</span>Hub
        </h1>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-l-2 border-orange-500 bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-700 px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "border-l-2 border-orange-500 bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
