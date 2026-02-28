# Frontend Integration Guide

## Setup

### 1. Wrap your app with Providers

In `src/app/layout.tsx`, wrap children with the `Providers` component:

```tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 2. Import the tRPC hooks

```tsx
import { trpc } from "@/lib/trpc";
```

## Available API

### Sessions

```tsx
// List all sessions
const { data: sessions } = trpc.session.list.useQuery();

// Get a session
const { data: session } = trpc.session.get.useQuery({ id: "..." });

// Create a session
const createSession = trpc.session.create.useMutation();
await createSession.mutateAsync({ title: "My Test Session" });
```

### Chat (Send Message → Generate Plan)

```tsx
const sendMessage = trpc.chat.sendMessage.useMutation();

const result = await sendMessage.mutateAsync({
  message: "Test the login flow on https://myapp.com",
  sessionId: "optional-existing-session-id",
});

// result.sessionId - the session ID (created if not provided)
// result.plan - the plan record from DB
// result.plan.parsed - { title, tasks: [{ title, instruction }] }
```

### Plan Management

```tsx
// Get plan with its tasks
const { data: plan } = trpc.plan.get.useQuery({ planId: "..." });

// Approve a plan
const approve = trpc.plan.approve.useMutation();
await approve.mutateAsync({ planId: "..." });

// Request changes to a plan
const requestChanges = trpc.plan.requestChanges.useMutation();
const updated = await requestChanges.mutateAsync({
  planId: "...",
  feedback: "Add a test for the signup flow too",
});
```

### Execution

```tsx
// Start execution (fire-and-forget, agents run in background)
const start = trpc.execution.start.useMutation();
await start.mutateAsync({ planId: "..." });

// Subscribe to real-time agent events via SSE
trpc.execution.onAgentEvent.useSubscription(
  { planId: "..." },
  {
    onData(event) {
      // event.id - unique event ID
      // event.data.taskId - which task this event belongs to
      // event.data.type - "step" | "error" | "completed" | "failed"
      // event.data.data - event payload
      // event.data.sequenceNum - ordering number
      console.log("Agent event:", event);
    },
  },
);

// Poll task statuses
const { data: taskStatuses } = trpc.execution.getTaskStatuses.useQuery(
  { planId: "..." },
  { refetchInterval: 2000 }, // poll every 2s
);
```

## Typical Flow

1. User types a message describing what to test
2. Call `chat.sendMessage` → get back a plan
3. Display the plan to the user for review
4. User approves → call `plan.approve`
   - Or requests changes → call `plan.requestChanges` → show updated plan
5. Call `execution.start` to kick off agents
6. Subscribe to `execution.onAgentEvent` for real-time updates
7. Display task progress (each task has a `browserbaseSessionId` for the Browserbase live viewer)

## Live Session Viewer

Each task gets a `browserbaseSessionId`. You can show the live browser session using:

```
https://www.browserbase.com/sessions/{browserbaseSessionId}
```

## Live Grid View

For an embeddable live view (one iframe per agent), use the `session_ready` event and `liveViewUrl`:

```tsx
trpc.execution.onAgentEvent.useSubscription(
  { planId },
  {
    onData(event) {
      if (event.data.type === "session_ready") {
        // event.data.data.liveViewUrl — embeddable iframe URL
        // event.data.data.browserbaseSessionId — raw session ID
      }
    },
  },
);
```

Render each agent's live browser in a CSS grid:

```tsx
{tasks.map((task) =>
  task.liveViewUrl ? (
    <iframe
      key={task.id}
      src={task.liveViewUrl}
      className="w-full h-full border-0"
      allow="clipboard-read; clipboard-write"
    />
  ) : null
)}
```

The `liveViewUrl` is also persisted on the task row and available via `execution.getTaskStatuses`, so you can render the grid even after reconnecting (no need to replay SSE events).

### How it works end-to-end

1. Frontend calls `execution.start({ planId })` — returns immediately
2. Frontend subscribes to `execution.onAgentEvent({ planId })`
3. Backend creates N tasks, launches N `runAgent()` calls in parallel
4. Each `runAgent` does `stagehand.init()` → calls Browserbase `sessions.debug(sessionId)` → emits `session_ready` with `{ taskId, liveViewUrl }`
5. Frontend receives `session_ready` events and renders `<iframe src={liveViewUrl} />` in a CSS grid
6. Each iframe shows a live remote browser — agents move in parallel
7. When agents finish, `completed`/`failed` events arrive and the frontend updates tile status

## Environment Variables

Make sure these are set:

```
MISTRAL_API_KEY="..."
BROWSERBASE_API_KEY="..."
BROWSERBASE_PROJECT_ID="..."
```

## Data Storage

Data is stored locally as JSON files in the `data/` directory. No database setup required.
