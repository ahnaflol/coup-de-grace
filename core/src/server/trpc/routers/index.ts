import { router } from "../index";
import { sessionRouter } from "./session";
import { chatRouter } from "./chat";
import { planRouter } from "./plan";
import { executionRouter } from "./execution";

export const appRouter = router({
  session: sessionRouter,
  chat: chatRouter,
  plan: planRouter,
  execution: executionRouter,
});

export type AppRouter = typeof appRouter;
