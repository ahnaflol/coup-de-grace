---
name: vibe-check
description: Run visual browser-based E2E testing using parallel CUA (Computer Use Agent) agents. Triggers for requests like "test this", "QA this feature", "run browser tests", "vibe check", "verify this works", "E2E test", "check if this works in the browser", "smoke test", "does this actually work", "visual testing", or any request to validate a feature end-to-end. This skill handles writing test plans, setting up tunnels, and launching parallel cloud browser agents that visually navigate and verify your application. Use this skill proactively whenever testing or QA is implied - even if the user doesn't explicitly say "vibe check".
---

# Vibe Check - Parallel CUA Browser Testing

Guide for running visual E2E tests through Coup de Grace's parallel Computer Use Agent platform. Each CUA agent runs in its own cloud browser session, visually navigating and verifying your application the way a human tester would.

## 1. Understand the Testing Target

Start by building enough context to write a useful test plan. The depth of exploration depends on how familiar you already are with the feature.

**If you built or modified the feature in this session**, skip deep exploration. You already understand the routes, components, data flow, and edge cases. Use that knowledge directly.

**If you're unfamiliar or starting a fresh session**, explore the surrounding context of the specific feature being tested:
- Read the relevant route files, page components, and API handlers
- Check the data model (Drizzle schema, types) for the feature area
- Look at nearby related modules that feed into or depend on the feature
- Review any loading states, error boundaries, or conditional rendering

Do NOT explore the entire codebase. Focus tightly on the feature under test and its immediate dependencies.

If you spot code during exploration that looks like it could introduce a bug or behave unexpectedly, note it down - it makes a great test case.

## 2. Write the Markdown Testing Plan

Create a descriptively named markdown file in the project root (e.g., `dashboard-testing-plan.md`, `checkout-flow-tests.md`, `auth-vibe-check.md`).

The plan has two sections: application context (so CUA agents understand what they're looking at) and test cases (what to verify).

### Application Context (top of file)

CUA agents are visual - they see screenshots and reason about what's on screen. They have no access to your source code. This context section is their only briefing on what the application does and how it works. Good context leads to better test execution.

Include:
- What the application does and its purpose
- Tech stack and architecture (keep it brief - just enough for the agents to understand behavior)
- The specific feature or area being tested
- Key pages, routes, and how to navigate between them
- Relevant data models and relationships (so agents understand what data they're working with)
- Authentication flow, if applicable
- Known quirks: loading states that take a moment, animations, modals, timing-sensitive interactions

### Test Cases (following context)

Write each test case as a natural language description of what to verify and what success looks like. CUA agents navigate visually - they find buttons by reading the screen, not by CSS selectors.

Guidelines:
- Describe WHAT to test and WHAT the expected outcome is
- Include edge cases, error states, and empty states
- Do not include code snippets, CSS selectors, XPaths, or step-by-step browser action sequences - the agents figure out navigation themselves
- Do not include source code in the plan
- Aim for 10-25 test cases that can each run independently in parallel
- Each test case should be self-contained (agents run in isolated sessions and can't share state)

### Example Structure

```markdown
# Application Context

MyApp is a project management tool built with Next.js. Users create projects, add tasks, and assign them to team members.

The feature under test is the **task board view**, accessible at `/projects/:id/board`. Tasks are displayed in columns by status (To Do, In Progress, Done). Users can drag tasks between columns, click to edit, and use the "+" button to create new tasks.

The app uses email/password authentication. After login, users land on `/dashboard`.

Known quirks: Drag-and-drop has a 200ms debounce before saving. Empty columns show a "No tasks yet" placeholder.

# Test Cases

## Verify task board loads with correct columns
Navigate to a project's board view. Confirm that three columns appear: "To Do", "In Progress", and "Done". Each column header should display a task count.

## Create a new task from the board
Click the "+" button on the "To Do" column. Fill in a task title and description. Submit the form. The new task should appear in the "To Do" column without a page refresh.

## Verify empty state
Open a project with no tasks. The board should display all three columns, each showing a "No tasks yet" placeholder message.
```

## 3. Collect Credentials

Before running the CLI, ask the user for login credentials. Each CUA agent runs in a completely isolated browser session with no shared cookies or state, so every agent needs to authenticate independently. The CLI distributes these credentials to all agents automatically.

Prompt the user:

> "What login credentials should I use for the browser testing agents? I need a username/email and password."

Only use `--skip-auth-credentials` if the user explicitly confirms the application has no authentication. Default to requiring credentials - most applications need them.

## 4. Set Up the Tunnel

CUA agents run in cloud browser sessions, so they can't reach `localhost`. A tunnel creates a public URL that routes traffic to your local dev server.

**Determine the port** from the project's config - check `package.json` scripts, `next.config`, `.env`, or framework defaults (Next.js: 3000, Vite: 5173, etc.).

**Ensure the dev server is running.** If it's not, start it first.

**Start a cloudflared tunnel:**

```bash
bunx cloudflared tunnel --url localhost:<PORT>
```

If `bunx` is unavailable, fall back to `npx`.

Watch the output for the generated tunnel URL (looks like `https://random-words.trycloudflare.com`). Keep this tunnel process running for the entire duration of testing - if it stops, the CUA agents lose access to your app.

## 5. Run Coup de Grace

Navigate to the Coup de Grace core directory and launch the test execution:

```bash
bun run coupdegrace --from-markdown "<path-to-plan.md>" --target-url "<tunnel-url>" --username "<user>" --password "<pass>"
```

Without authentication:

```bash
bun run coupdegrace --from-markdown "<path-to-plan.md>" --target-url "<tunnel-url>" --skip-auth-credentials
```

This parses the test plan, starts the execution dashboard, and launches parallel CUA agents. Your browser will open to show real-time execution progress - each agent's browser session is visible as it runs through its assigned test case.
