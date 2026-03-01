# Coup de Grace CLI

Command-line interface for triggering parallel browser agent testing from a markdown plan.

## How It Works

The CLI takes a markdown testing plan written by a developer (or a coding agent), parses it into structured tasks using Mistral's magistral-medium model, inserts the plan into the database, and launches the execution dashboard where parallel CUA (Computer Use Agent) browser sessions carry out the tests.

### Flow

```
Markdown plan --> Magistral parses into tasks --> DB insert --> Dev server starts --> Browser opens --> Agents execute
```

1. **Read** the markdown file
2. **Parse** it with magistral-medium into a structured plan (10-25 parallel tasks). Each task gets the application context prepended so agents understand what they're testing. This runs in parallel with starting the dev server.
3. **Insert** the plan into PostgreSQL with status "approved"
4. **Open** the execution dashboard in the browser and trigger the orchestrator via tRPC, which launches all CUA agents in parallel

## Usage

```bash
bun run coupdegrace --from-markdown <plan.md> --target-url <url> --username <user> --password <pass>
```

### Options

| Flag | Required | Description |
|------|----------|-------------|
| `--from-markdown <path>` | Yes | Path to the markdown testing plan file |
| `--target-url <url>` | Yes | Public URL where the app under test is accessible (typically a cloudflared tunnel URL) |
| `--username <str>` | Yes* | Login username for the target application |
| `--password <str>` | Yes* | Login password for the target application |
| `--skip-auth-credentials` | No | Bypass credential requirement when the app has no authentication |

*Credentials are mandatory by default. The CLI will fail with a descriptive error if they're missing. Use `--skip-auth-credentials` only when the application genuinely has no auth.

### Examples

With credentials:
```bash
bun run coupdegrace \
  --from-markdown dashboard-tests.md \
  --target-url https://abc123.trycloudflare.com \
  --username admin@example.com \
  --password secret123
```

Without auth:
```bash
bun run coupdegrace \
  --from-markdown landing-page-tests.md \
  --target-url https://abc123.trycloudflare.com \
  --skip-auth-credentials
```

## Markdown Plan Format

The plan has two sections. The format is flexible -- magistral handles variation -- but the structure matters.

### Application Context (top of file)

Describe the application and what's being tested. CUA agents are visual -- they see screenshots and reason about what's on screen. This context is their only briefing.

Include:
- What the app does
- Tech stack (brief)
- The feature being tested
- Key pages and routes
- Data model if relevant
- Auth flow
- Known quirks (loading states, animations, timing)

### Test Cases (after context)

Describe what to verify in natural language. Don't write code, CSS selectors, or step-by-step browser scripts -- the agents figure out navigation themselves using visual reasoning.

Each test case should describe:
- What to test
- What success looks like
- Edge cases worth checking

Aim for 10-25 independent test cases.

### Example

```markdown
# Application Context

TaskFlow is a project management app built with Next.js. Users create projects,
add tasks, and assign them to team members. The feature under test is the task
board at /projects/:id/board, which shows tasks in columns by status.

Login is at /login with email/password. After login, users land on /dashboard.

Known quirk: drag-and-drop has a 200ms debounce before saving.

# Test Cases

## Task board loads with correct columns
Navigate to a project board. Confirm three columns: To Do, In Progress, Done.
Each column header should show a task count.

## Create a new task
Click "+" on the To Do column. Fill in title and description. Submit.
The task should appear in To Do without a page refresh.

## Empty project state
Open a project with no tasks. All three columns should show
"No tasks yet" placeholders.
```

## Architecture

```
src/cli/
  index.ts            -- Entry point, argument parsing, orchestration
  parse-markdown.ts   -- Magistral-powered markdown-to-plan parser
  prompt.ts           -- System prompt for the parser agent
  server-lifecycle.ts -- Dev server auto-start and port detection
```

- **parse-markdown.ts** calls magistral-medium, gets raw JSON text back, strips markdown code fences, and validates against `planSchema` from `src/server/schemas.ts`
- **server-lifecycle.ts** checks if the port is in use via TCP socket. If not, spawns `bun dev` as a detached background process and polls until ready (30s timeout)
- **index.ts** creates its own tRPC client to call `execution.start` on the web server, ensuring the orchestrator and EventEmitter events run in the server process so the execution dashboard gets real-time updates

## Environment Variables

The CLI reads from `.env` (loaded via `tsx --env-file=.env`):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `MISTRAL_API_KEY` | Yes | For magistral-medium plan parsing |
| `BROWSER_USE_API_KEY` | Yes | For CUA agent execution |
| `PORT` | No | Dev server port (default: 3000) |
