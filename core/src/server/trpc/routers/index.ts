import { router } from "../index";
import { planRouter } from "./plan";
import { executionRouter } from "./execution";

export const appRouter = router({
  plan: planRouter,
  execution: executionRouter,
});

export type AppRouter = typeof appRouter;
