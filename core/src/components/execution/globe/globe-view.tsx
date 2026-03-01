"use client";

import { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GlobeSphere } from "./globe-sphere";
import { AgentMarker } from "./agent-marker";
import { distributePoints } from "./distribute-points";
import { TaskDetailSheet } from "../task-detail-sheet";
import type { TaskStatus } from "@/types";
import type { TaskEventWithTime } from "../execution-dashboard";

export interface GlobeTask {
  id: string;
  title: string;
  instruction: string;
  startUrl: string | null;
  status: TaskStatus;
  liveUrl: string | null;
  browserUseSessionId: string | null;
  shareUrl: string | null;
  result: unknown;
}

export function GlobeView({
  tasks,
  logsByTaskId,
}: {
  tasks: GlobeTask[];
  logsByTaskId: Record<string, TaskEventWithTime[]>;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const positions = useMemo(
    () => distributePoints(Math.max(tasks.length, 1)),
    [tasks.length],
  );

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="relative flex-1 min-h-0">
      {tasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p className="text-muted-foreground text-sm">
            Waiting for agents to start...
          </p>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: "transparent" }}
      >
        <OrbitControls
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          minDistance={4}
          maxDistance={10}
        />
        <GlobeSphere />
        {tasks.map((task, i) => (
          <AgentMarker
            key={task.id}
            position={positions[i]!}
            status={task.status}
            title={task.title}
            instruction={task.instruction}
            liveUrl={task.liveUrl}
            result={task.result}
            onClick={() => setSelectedTaskId(task.id)}
          />
        ))}
      </Canvas>

      {selectedTask && (
        <TaskDetailSheet
          open={!!selectedTaskId}
          onOpenChange={(open) => {
            if (!open) setSelectedTaskId(null);
          }}
          taskTitle={selectedTask.title}
          result={selectedTask.result}
          events={logsByTaskId[selectedTask.id] ?? []}
          status={selectedTask.status}
        />
      )}
    </div>
  );
}
