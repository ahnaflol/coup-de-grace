import { z } from "zod";
import { router, publicProcedure } from "../index";
import { plans, tasks, agentEvents } from "../../db/schema";
import { and, eq, gt } from "drizzle-orm";
import { tracked } from "@trpc/server";
import { orchestrate } from "../../agents/orchestrator";
import { agentEventEmitter, type AgentEvent } from "../../agents/events";

export const executionRouter = router({
  start: publicProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [locked] = await ctx.db
        .update(plans)
        .set({ status: "executing", updatedAt: new Date() })
        .where(and(eq(plans.id, input.planId), eq(plans.status, "approved")))
        .returning({ id: plans.id });

      if (!locked) {
        const plan = await ctx.db.query.plans.findFirst({
          where: eq(plans.id, input.planId),
          columns: { id: true, status: true },
        });
        if (!plan) throw new Error("Plan not found");
        throw new Error(
          `Plan must be approved before execution (current status: ${plan.status})`
        );
      }

      // Fire-and-forget
      orchestrate(input.planId).catch(console.error);

      return { started: true, planId: input.planId };
    }),

  onAgentEvent: publicProcedure
    .input(
      z.object({
        planId: z.string(),
        lastEventId: z.string().nullish(),
      })
    )
    .subscription(async function* ({ ctx, input }) {
      // Get task IDs for this plan
      const planTasks = await ctx.db.query.tasks.findMany({
        where: eq(tasks.planId, input.planId),
        columns: { id: true },
      });
      const taskIds = new Set(planTasks.map((t) => t.id));

      // Replay missed events if reconnecting
      if (input.lastEventId) {
        const missedEvents = await ctx.db.query.agentEvents.findMany({
          where: gt(agentEvents.createdAt, new Date(0)), // get all, filter below
        });

        let foundLast = false;
        for (const event of missedEvents) {
          if (event.id === input.lastEventId) {
            foundLast = true;
            continue;
          }
          if (foundLast && taskIds.has(event.taskId)) {
            yield tracked(event.id, {
              taskId: event.taskId,
              type: event.type,
              data: event.data,
              sequenceNum: event.sequenceNum,
            });
          }
        }
      }

      // Listen for live events
      const eventQueue: AgentEvent[] = [];
      let resolve: (() => void) | null = null;

      const handler = (event: AgentEvent) => {
        if (taskIds.has(event.taskId)) {
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
      return ctx.db.query.tasks.findMany({
        where: eq(tasks.planId, input.planId),
      });
    }),
});
