import { router } from "../index";
import { chatRouter } from "./chat";
import { executionRouter } from "./execution";
import { planRouter } from "./plan";
import { sessionRouter } from "./session";

export const appRouter = router({
  session: sessionRouter,
  chat: chatRouter,
  plan: planRouter,
  execution: executionRouter,
});

export type AppRouter = typeof appRouter;
