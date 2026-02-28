import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

// Tables
export const plans = pgTable("plans", {
  id: uuid().primaryKey().defaultRandom(),
  userPrompt: text().notNull(),
  content: text().notNull(), // JSON string of plan
  status: text().default("draft").notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  planId: uuid()
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  title: text().notNull(),
  instruction: text().notNull(),
  startUrl: text(),
  status: text().default("pending").notNull(),
  result: jsonb(),
  browserUseSessionId: text(),
  liveUrl: text(),
  shareUrl: text(),
  startedAt: timestamp(),
  completedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const agentEvents = pgTable("agent_events", {
  id: uuid().primaryKey().defaultRandom(),
  taskId: uuid()
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  type: text().notNull(),
  data: jsonb(),
  sequenceNum: integer().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
