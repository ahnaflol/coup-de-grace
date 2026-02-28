import { tracked } from "@trpc/server";
import { z } from "zod";

import { agentEventEmitter, type AgentEvent } from "../../agents/events";
import { orchestrate } from "../../agents/orchestrator";
import { router, publicProcedure } from "../index";

export const executionRouter = router({
  start: publicProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const locked = await ctx.db.plans.update(
        input.planId,
        { status: "executing" },
        { status: "approved" }
      );

      if (!locked) {
        const plan = await ctx.db.plans.findById(input.planId);
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
      // Replay missed events if reconnecting
      if (input.lastEventId) {
        const lastEvent = await ctx.db.agentEvents.findById(input.lastEventId);

        if (lastEvent && lastEvent.planId === input.planId) {
          const threshold = new Date(
            new Date(lastEvent.createdAt).getTime() - 1
          ).toISOString();

          const candidateEvents = await ctx.db.agentEvents.findByPlanId(
            input.planId,
            {
              afterCreatedAt: threshold,
              orderByCreatedAtAsc: true,
            }
          );

          let foundLast = false;
          for (const event of candidateEvents) {
            if (!foundLast) {
              if (event.id === input.lastEventId) foundLast = true;
              continue;
            }
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
      return ctx.db.tasks.findByPlanId(input.planId);
    }),
});
