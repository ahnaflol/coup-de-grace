import { z } from "zod";

import { router, publicProcedure } from "../index";

export const sessionRouter = router({
  create: publicProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.sessions.insert({ title: input.title });
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sessions.findById(input.id, { withPlans: true });
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.sessions.findAll({ orderByCreatedAtDesc: true });
  }),
});
