"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Mesh } from "three";
import type { TaskStatus } from "@/types";

const STATUS_COLORS: Record<TaskStatus, string> = {
  running: "#34d399",
  completed: "#059669",
  failed: "#ef4444",
  pending: "#71717a",
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractResultInfo(result: unknown) {
  if (!isRecord(result)) return null;
  const output = isRecord(result.output) ? result.output : null;
  const outcome =
    output && typeof output.outcome === "string" ? output.outcome : null;
  const summary =
    output && typeof output.summary === "string" ? output.summary : null;
  const stepsCompleted =
    output && Array.isArray(output.stepsCompleted)
      ? (output.stepsCompleted as string[])
      : [];
  const isSuccess =
    typeof result.isSuccess === "boolean" ? result.isSuccess : null;
  const passed = outcome ? outcome === "pass" : isSuccess === true;
  return { passed, outcome, summary, stepCount: stepsCompleted.length };
}

export function AgentMarker({
  position,
  status,
  title,
  instruction,
  liveUrl,
  result,
  onClick,
}: {
  position: [number, number, number];
  status: TaskStatus;
  title: string;
  instruction: string;
  liveUrl: string | null;
  result: unknown;
  onClick: () => void;
}) {
  const ref = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isDone = status === "completed" || status === "failed";

  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (status === "running") {
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.15;
      ref.current.scale.setScalar(s);
    } else {
      ref.current.scale.setScalar(1);
    }
  });

  return (
    <group position={position}>
      {/* Small pin dot on globe surface */}
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color={STATUS_COLORS[status]} />
      </mesh>

      {/* Floating card panel — always visible */}
      <Html
        distanceFactor={6}
        center
        position={[0, 0.15, 0]}
        style={{ pointerEvents: "auto" }}
        occlude={false}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onMouseEnter={() => {
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onMouseLeave={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
          className={`
            relative overflow-hidden rounded-lg border bg-zinc-950 shadow-2xl
            transition-transform duration-200
            ${hovered ? "scale-110 border-zinc-500 z-50" : "border-zinc-800"}
          `}
          style={{ width: 180, height: 120 }}
        >
          {/* Card content — mirrors TaskCard */}
          {isDone ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
              {(() => {
                const info = extractResultInfo(result);
                const passed = info?.passed ?? status === "completed";
                return (
                  <>
                    {passed ? (
                      <CheckCircle2 className="size-6 text-emerald-500" />
                    ) : (
                      <XCircle className="size-6 text-red-500" />
                    )}
                    <span className="mt-1 text-[10px] font-bold tracking-widest uppercase text-zinc-300">
                      {passed ? "PASS" : "FAIL"}
                    </span>
                    {info?.summary && (
                      <p className="mt-1 text-[8px] text-zinc-500 text-center max-w-[85%] line-clamp-2">
                        {info.summary}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          ) : liveUrl ? (
            <iframe
              src={liveUrl}
              className="absolute inset-0 h-full w-full border-0 pointer-events-none"
              allow="clipboard-read; clipboard-write"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-2">
              <span className="text-[9px] text-zinc-600 text-center leading-tight line-clamp-3">
                {status === "pending" ? title : "Connecting..."}
              </span>
            </div>
          )}

          {/* Status dot */}
          <div className="absolute bottom-1 left-1 z-10">
            <span
              className={`block size-1.5 rounded-full ${
                status === "running"
                  ? "bg-emerald-400 animate-pulse"
                  : status === "completed"
                  ? "bg-emerald-600"
                  : status === "failed"
                  ? "bg-red-500"
                  : "bg-zinc-600"
              }`}
            />
          </div>

          {/* Hover overlay with title */}
          {hovered && (
            <div className="absolute inset-0 z-20">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-2">
                <h3 className="text-[10px] font-semibold text-white truncate">
                  {title}
                </h3>
                <p className="text-[8px] text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                  {instruction}
                </p>
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
