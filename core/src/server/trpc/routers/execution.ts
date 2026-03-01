import { z } from "zod";
import { router, publicProcedure } from "../index";
import { tasks, agentEvents, extractedRows } from "../../db/schema";
import { and, asc, eq, gt } from "drizzle-orm";
import { tracked } from "@trpc/server";
import { agentEventEmitter, type AgentEvent } from "../../agents/events";
import type { AgentEventType, TaskStatus } from "../../../types";
import { startApprovedPlanExecution } from "@/server/execution/start-plan-execution";

const AGENT_EVENT_TYPES = [
  "step",
  "session_ready",
  "error",
  "completed",
  "failed",
  "row_extracted",
] as const satisfies readonly AgentEventType[];

function toAgentEventType(value: string): AgentEventType {
  return (AGENT_EVENT_TYPES as readonly string[]).includes(value)
    ? (value as AgentEventType)
    : "error";
}

const TASK_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
] as const satisfies readonly TaskStatus[];

function toTaskStatus(value: string): TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value)
    ? (value as TaskStatus)
    : "failed";
}

export const executionRouter = router({
  start: publicProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return startApprovedPlanExecution({
        db: ctx.db,
        planId: input.planId,
      });
    }),

  onAgentEvent: publicProcedure
    .input(
      z.object({
        planId: z.string(),
        lastEventId: z.string().nullish(),
      })
    )
    .subscription(async function* ({ ctx, input }) {
      // Replay missed events if reconnecting
      if (input.lastEventId) {
        const [lastEvent] = await ctx.db
          .select({
            id: agentEvents.id,
            taskId: agentEvents.taskId,
            createdAt: agentEvents.createdAt,
          })
          .from(agentEvents)
          .where(eq(agentEvents.id, input.lastEventId))
          .limit(1);

        if (lastEvent) {
          const [lastEventTask] = await ctx.db
            .select({ planId: tasks.planId })
            .from(tasks)
            .where(eq(tasks.id, lastEvent.taskId))
            .limit(1);

          if (lastEventTask?.planId === input.planId) {
            const candidateEvents = await ctx.db
              .select({
                id: agentEvents.id,
                taskId: agentEvents.taskId,
                type: agentEvents.type,
                data: agentEvents.data,
                sequenceNum: agentEvents.sequenceNum,
                createdAt: agentEvents.createdAt,
              })
              .from(agentEvents)
              .innerJoin(tasks, eq(agentEvents.taskId, tasks.id))
              .where(
                and(
                  eq(tasks.planId, input.planId),
                  gt(
                    agentEvents.createdAt,
                    new Date(lastEvent.createdAt.getTime() - 1)
                  )
                )
              )
              .orderBy(asc(agentEvents.createdAt), asc(agentEvents.id));

            let foundLast = false;
            for (const event of candidateEvents) {
              if (!foundLast) {
                if (event.id === input.lastEventId) foundLast = true;
                continue;
              }
              yield tracked(event.id, {
                taskId: event.taskId,
                type: toAgentEventType(event.type),
                data: event.data,
                sequenceNum: event.sequenceNum,
              });
            }
          }
        }
      }

      // Listen for live events
      const eventQueue: AgentEvent[] = [];
      let resolve: (() => void) | null = null;

      const handler = (event: AgentEvent) => {
        if (event.planId === input.planId) {
          eventQueue.push(event);
          resolve?.();
        }
      };

      agentEventEmitter.on("agentEvent", handler);

      try {
        while (true) {
          while (eventQueue.length > 0) {
            const event = eventQueue.shift()!;
            yield tracked(event.id, {
              taskId: event.taskId,
              type: event.type,
              data: event.data,
              sequenceNum: event.sequenceNum,
            });
          }

          // Wait for next event
          await new Promise<void>((r) => {
            resolve = r;
          });
        }
      } finally {
        agentEventEmitter.off("agentEvent", handler);
      }
    }),

  getTaskStatuses: publicProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: tasks.id,
          title: tasks.title,
          instruction: tasks.instruction,
          startUrl: tasks.startUrl,
          status: tasks.status,
          liveUrl: tasks.liveUrl,
          browserUseSessionId: tasks.browserUseSessionId,
          shareUrl: tasks.shareUrl,
          result: tasks.result,
        })
        .from(tasks)
        .where(eq(tasks.planId, input.planId));

      return rows.map((r) => ({ ...r, status: toTaskStatus(r.status) }));
    }),

  getExtractedRows: publicProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: extractedRows.id,
          planId: extractedRows.planId,
          taskId: extractedRows.taskId,
          rowIndex: extractedRows.rowIndex,
          data: extractedRows.data,
          createdAt: extractedRows.createdAt,
        })
        .from(extractedRows)
        .where(eq(extractedRows.planId, input.planId))
        .orderBy(asc(extractedRows.createdAt));

      return rows;
    }),
});
