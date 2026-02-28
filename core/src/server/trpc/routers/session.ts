import { z } from "zod";
import { router, publicProcedure } from "../index";
import { sessions } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const sessionRouter = router({
  create: publicProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [session] = await ctx.db
        .insert(sessions)
        .values({ title: input.title })
        .returning();
      return session;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.query.sessions.findFirst({
        where: eq(sessions.id, input.id),
        with: { plans: true },
      });
      return session ?? null;
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.sessions.findMany({
      orderBy: desc(sessions.createdAt),
    });
  }),
});
