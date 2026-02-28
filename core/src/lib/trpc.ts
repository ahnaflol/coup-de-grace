import { createTRPCClient, httpBatchLink, splitLink, unstable_httpSubscriptionLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "@/server/trpc/routers";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function makeTRPCLinks() {
  return [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: unstable_httpSubscriptionLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
      }),
      false: httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
      }),
    }),
  ];
}

// Vanilla client for server-side use
export const trpcClient = createTRPCClient<AppRouter>({
  links: makeTRPCLinks(),
});
