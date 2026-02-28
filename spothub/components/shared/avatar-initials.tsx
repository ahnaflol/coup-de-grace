"use client";

import { getInitials } from "@/lib/formatters";

const COLORS = [
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-rose-600",
];

const SIZE_CLASSES = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
} as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

interface AvatarInitialsProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarInitials({ name, size = "md" }: AvatarInitialsProps) {
  const initials = getInitials(name);
  const colorIndex = hashName(name) % COLORS.length;

  return (
    <div
      className={`${COLORS[colorIndex]} ${SIZE_CLASSES[size]} inline-flex items-center justify-center rounded-full font-medium text-white`}
    >
      {initials}
    </div>
  );
}
