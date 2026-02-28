import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const planStatusEnum = pgEnum("plan_status", [
  "draft",
  "approved",
  "executing",
  "completed",
  "failed",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const agentEventTypeEnum = pgEnum("agent_event_type", [
  "step",
  "session_ready",
  "error",
  "completed",
  "failed",
]);

// Tables
export const sessions = pgTable("sessions", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const plans = pgTable("plans", {
  id: uuid().primaryKey().defaultRandom(),
  sessionId: uuid()
    .notNull()
    .references(() => sessions.id),
  userPrompt: text().notNull(),
  content: text().notNull(), // JSON string of plan
  status: planStatusEnum().default("draft").notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  planId: uuid()
    .notNull()
    .references(() => plans.id),
  title: text().notNull(),
  instruction: text().notNull(),
  status: taskStatusEnum().default("pending").notNull(),
  result: jsonb(),
  browserbaseSessionId: text(),
  liveViewUrl: text(),
  startedAt: timestamp(),
  completedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const agentEvents = pgTable("agent_events", {
  id: uuid().primaryKey().defaultRandom(),
  taskId: uuid()
    .notNull()
    .references(() => tasks.id),
  type: agentEventTypeEnum().notNull(),
  data: jsonb(),
  sequenceNum: integer().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Relations
export const sessionsRelations = relations(sessions, ({ many }) => ({
  plans: many(plans),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  session: one(sessions, {
    fields: [plans.sessionId],
    references: [sessions.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  plan: one(plans, {
    fields: [tasks.planId],
    references: [plans.id],
  }),
  agentEvents: many(agentEvents),
}));

export const agentEventsRelations = relations(agentEvents, ({ one }) => ({
  task: one(tasks, {
    fields: [agentEvents.taskId],
    references: [tasks.id],
  }),
}));
