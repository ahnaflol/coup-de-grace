#!/usr/bin/env tsx

import { readFile } from "fs/promises";
import { basename, resolve } from "path";
import { Command } from "commander";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import { db } from "../server/db";
import { plans } from "../server/db/schema";
import { parseMarkdownToPlan } from "./parse-markdown";
import { ensureDevServer } from "./server-lifecycle";
import type { AppRouter } from "../server/trpc/routers";

const program = new Command();

program
  .name("coupdegrace")
  .description("Coup de Grace - Parallel browser agent testing from the CLI")
  .requiredOption("--from-markdown <path>", "Path to a markdown testing plan")
  .requiredOption("--target-url <url>", "Target application URL to test")
  .option("--username <str>", "Login username for the target application")
  .option("--password <str>", "Login password for the target application")
  .option(
    "--skip-auth-credentials",
    "Skip credential requirement for apps without authentication"
  )
  .action(async (opts) => {
    try {
      await run(opts);
    } catch (err) {
      console.error(
        `\nError: ${err instanceof Error ? err.message : String(err)}`
      );
      process.exit(1);
    }
  });

interface CliOptions {
  fromMarkdown: string;
  targetUrl: string;
  username?: string;
  password?: string;
  skipAuthCredentials?: boolean;
}

async function run(opts: CliOptions) {
  // 1. Validate credentials
  if (!opts.username || !opts.password) {
    if (!opts.skipAuthCredentials) {
      console.error(`Error: Login credentials are required for CUA agents to authenticate with the target application.

Please provide credentials:
  coupdegrace --from-markdown <plan> --target-url <url> --username <user> --password <pass>

If the application does not require authentication, explicitly bypass with:
  coupdegrace --from-markdown <plan> --target-url <url> --skip-auth-credentials`);
      process.exit(1);
    }
  }

  const credentials =
    opts.username && opts.password
      ? { username: opts.username, password: opts.password }
      : undefined;

  // 2. Read markdown file
  const markdownPath = resolve(opts.fromMarkdown);
  console.log(`\n[1/5] Reading markdown plan from ${markdownPath}`);

  let markdown: string;
  try {
    markdown = await readFile(markdownPath, "utf-8");
  } catch {
    throw new Error(`Could not read file: ${markdownPath}`);
  }

  // 3. Parse markdown and ensure dev server are independent -- run in parallel
  const port = parseInt(process.env.PORT || "3000", 10);
  console.log("[2/5] Parsing plan and ensuring dev server is ready...");

  const [parsedPlan] = await Promise.all([
    parseMarkdownToPlan({ markdown, targetUrl: opts.targetUrl, credentials }),
    ensureDevServer(port),
  ]);

  console.log(
    `  Plan: "${parsedPlan.title}" with ${parsedPlan.tasks.length} tasks`
  );

  // 4. Insert plan into database
  console.log("[3/5] Inserting plan into database...");

  const filename = basename(markdownPath);
  const [insertedPlan] = await db
    .insert(plans)
    .values({
      userPrompt: `CLI: ${filename}`,
      content: JSON.stringify(parsedPlan),
      status: "approved",
    })
    .returning({ id: plans.id });

  console.log(`  Plan ID: ${insertedPlan.id}`);

  // 5. Open browser and trigger execution in parallel
  const baseUrl = `http://localhost:${port}`;
  const executionUrl = `${baseUrl}/execute?planId=${insertedPlan.id}`;
  console.log("[4/5] Opening browser and triggering execution...");

  const client = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
      }),
    ],
  });

  await client.execution.start.mutate({ planId: insertedPlan.id });

  console.log(`\n[5/5] Execution started successfully!`);
  console.log(`  Plan: "${parsedPlan.title}"`);
  console.log(`  Tasks: ${parsedPlan.tasks.length}`);
  console.log(`  View: ${executionUrl}`);
  console.log(`\n__EXECUTION_URL__=${executionUrl}`);

  process.exit(0);
}

program.parse();
