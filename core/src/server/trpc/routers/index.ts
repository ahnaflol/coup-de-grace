import { router } from "../index";
import { chatRouter } from "./chat";
import { planRouter } from "./plan";
import { executionRouter } from "./execution";

export const appRouter = router({
  chat: chatRouter,
  plan: planRouter,
  execution: executionRouter,
});

export type AppRouter = typeof appRouter;
