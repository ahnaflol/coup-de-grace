import { initTRPC } from "@trpc/server";
import superjson from "superjson";

import { db } from "../db";

export function createTRPCContext() {
  return { db };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
