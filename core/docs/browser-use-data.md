# Browser-Use Cloud SDK — Data Reference

This document lists all data available from the Browser-Use Cloud SDK (v3.1.0) at each lifecycle phase of a task run.

---

## Before session — `RunTaskOptions`

Passed to `client.run(instruction, options)`:

| Field | Type | Description |
|-------|------|-------------|
| `startUrl` | `string` | Initial URL to navigate to |
| `sessionId` | `string` | BrowserUse session ID (required when using pre-created sessions) |
| `allowedDomains` | `string[]` | Domains the agent is allowed to visit |
| `maxSteps` | `number` | Maximum number of agent steps (default: 25) |
| `schema` | `ZodSchema` | Zod schema the agent's structured output must conform to |
| `highlightElements` | `boolean` | Whether to highlight interactive elements in screenshots |
| `metadata` | `Record<string, unknown>` | Arbitrary metadata attached to the task |

---

## Session created — `SessionView`

Returned by `client.sessions.create(options)`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Session ID (used to associate tasks) |
| `liveUrl` | `string \| null` | iframe-embeddable live browser view URL |
| `publicShareUrl` | `string \| null` | Publicly shareable viewer URL |
| `status` | `string` | Session status (e.g. `"running"`) |
| `persistMemory` | `boolean` | Whether memory persists across runs |
| `keepAlive` | `boolean` | Whether the session stays alive after task completes |

`client.sessions.createShare(sessionId)` returns `{ shareUrl: string }`.

---

## During run — `TaskStepView` (per step)

Each iteration of `for await (const step of run)` yields a `TaskStepView`:

| Field | Type | Captured in DB |
|-------|------|---------------|
| `number` | `number` | ✅ |
| `memory` | `string \| undefined` | ✅ |
| `evaluationPreviousGoal` | `string \| undefined` | ✅ |
| `nextGoal` | `string \| undefined` | ✅ |
| `url` | `string \| undefined` | ✅ |
| `screenshotUrl` | `string \| null \| undefined` | ✅ |
| `actions` | `unknown[]` | ✅ |

All fields are stored in the `agent_events` table as a JSONB `data` blob with `type = "step"`.

---

## After completion — `TaskResult` / `TaskView`

`run.result` (available after the async iterator completes):

### Top-level `TaskView` fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Task ID in Browser-Use Cloud |
| `sessionId` | `string` | Associated session ID |
| `llm` | `string` | LLM model used |
| `task` | `string` | The instruction text |
| `status` | `string` | Final status (`"completed"`, `"failed"`, etc.) |
| `createdAt` | `string` | ISO timestamp |
| `startedAt` | `string \| null` | ISO timestamp |
| `finishedAt` | `string \| null` | ISO timestamp |
| `output` | `AgentResult` | Structured output (see below) |
| `steps` | `TaskStepView[]` | All steps as a final array |
| `outputFiles` | `string[]` | URLs of any files produced |
| `isSuccess` | `boolean \| null` | Whether the task succeeded |
| `judgement` | `string \| null` | Raw judge response |
| `judgeVerdict` | `string \| null` | Parsed judge verdict |
| `cost` | `number \| null` | Token cost in USD |
| `suggestions` | `string[] \| null` | Agent suggestions for follow-up |

### `output` — `AgentResult` (structured schema)

Conforms to `agentResultSchema` defined in `src/server/schemas.ts`:

| Field | Type | Description |
|-------|------|-------------|
| `outcome` | `"pass" \| "fail"` | Whether the task goal was achieved |
| `summary` | `string` | Human-readable summary of what happened |
| `stepsCompleted` | `string[]` | Checklist of completed sub-steps |
| `reason` | `string \| undefined` | Explanation for the outcome |

---

## Storage in this application

| Data | Where stored |
|------|-------------|
| Per-step data | `agent_events` table, `type = "step"`, `data` JSONB |
| Session info | `tasks.browserUseSessionId`, `tasks.liveUrl`, `tasks.shareUrl` |
| Full `TaskResult` | `tasks.result` JSONB column |
| `AgentResult` | Inside `tasks.result.output` |

The full `TaskResult` (including `output`, `isSuccess`, `cost`, `judgeVerdict`) is returned to the frontend via `execution.getTaskStatuses` as the `result` field.
