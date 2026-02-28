import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

import type {
  AgentEvent,
  AgentEventType,
  Plan,
  PlanStatus,
  PlanWithTasks,
  Session,
  SessionWithPlans,
  Task,
  TaskStatus,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

const FILES = {
  sessions: "sessions.json",
  plans: "plans.json",
  tasks: "tasks.json",
  agentEvents: "agent-events.json",
} as const;

// --- globalThis singleton for Next.js HMR survival ---

interface StorageState {
  sessions: Map<string, Session>;
  plans: Map<string, Plan>;
  tasks: Map<string, Task>;
  agentEvents: Map<string, AgentEvent>;
  initialized: boolean;
}

const globalForStorage = globalThis as unknown as { __coreStorage?: StorageState };

function getState(): StorageState {
  if (!globalForStorage.__coreStorage) {
    globalForStorage.__coreStorage = {
      sessions: new Map(),
      plans: new Map(),
      tasks: new Map(),
      agentEvents: new Map(),
      initialized: false,
    };
  }
  return globalForStorage.__coreStorage;
}

// --- File I/O ---

async function readJsonFile<T>(filename: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// --- Init ---

let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  const state = getState();
  if (state.initialized) return;
  if (!initPromise) {
    initPromise = doInit();
  }
  await initPromise;
}

async function doInit(): Promise<void> {
  const state = getState();
  await fs.mkdir(DATA_DIR, { recursive: true });

  const [sessions, plans, tasks, agentEvents] = await Promise.all([
    readJsonFile<Session>(FILES.sessions),
    readJsonFile<Plan>(FILES.plans),
    readJsonFile<Task>(FILES.tasks),
    readJsonFile<AgentEvent>(FILES.agentEvents),
  ]);

  for (const s of sessions) state.sessions.set(s.id, s);
  for (const p of plans) state.plans.set(p.id, p);
  for (const t of tasks) state.tasks.set(t.id, t);
  for (const e of agentEvents) state.agentEvents.set(e.id, e);

  state.initialized = true;
}

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// --- Persist helpers ---

type CollectionKey = keyof Omit<StorageState, "initialized">;

async function persist(collection: CollectionKey): Promise<void> {
  const state = getState();
  const values = Array.from(state[collection].values() as Iterable<unknown>);
  await writeJsonFile(FILES[collection], values);
}

// --- Session operations ---

async function insertSession(values: { title: string }): Promise<Session> {
  await ensureInit();
  const state = getState();
  const timestamp = now();
  const session: Session = {
    id: generateId(),
    title: values.title,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  state.sessions.set(session.id, session);
  await persist("sessions");
  return session;
}

async function findSessionById(
  id: string,
  opts?: { withPlans?: boolean }
): Promise<SessionWithPlans | Session | null> {
  await ensureInit();
  const state = getState();
  const session = state.sessions.get(id);
  if (!session) return null;

  if (opts?.withPlans) {
    const plans = Array.from(state.plans.values())
      .filter((p) => p.sessionId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { ...session, plans };
  }

  return { ...session };
}

async function findAllSessions(opts?: {
  orderByCreatedAtDesc?: boolean;
}): Promise<Session[]> {
  await ensureInit();
  const state = getState();
  const all = Array.from(state.sessions.values());
  if (opts?.orderByCreatedAtDesc) {
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return all;
}

// --- Plan operations ---

async function insertPlan(values: {
  sessionId: string;
  userPrompt: string;
  content: string;
  status: PlanStatus;
}): Promise<Plan> {
  await ensureInit();
  const state = getState();
  const timestamp = now();
  const plan: Plan = {
    id: generateId(),
    sessionId: values.sessionId,
    userPrompt: values.userPrompt,
    content: values.content,
    status: values.status,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  state.plans.set(plan.id, plan);
  await persist("plans");
  return plan;
}

async function findPlanById(
  id: string,
  opts?: { withTasks?: boolean }
): Promise<PlanWithTasks | Plan | null> {
  await ensureInit();
  const state = getState();
  const plan = state.plans.get(id);
  if (!plan) return null;

  if (opts?.withTasks) {
    const tasks = Array.from(state.tasks.values())
      .filter((t) => t.planId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { ...plan, tasks };
  }

  return { ...plan };
}

async function updatePlan(
  id: string,
  set: Partial<Omit<Plan, "id" | "createdAt">>,
  where?: { status?: PlanStatus }
): Promise<Plan | null> {
  await ensureInit();
  const state = getState();
  const plan = state.plans.get(id);
  if (!plan) return null;
  if (where?.status !== undefined && plan.status !== where.status) return null;

  const updated: Plan = {
    ...plan,
    ...set,
    id: plan.id,
    createdAt: plan.createdAt,
    updatedAt: now(),
  };
  state.plans.set(id, updated);
  await persist("plans");
  return updated;
}

// --- Task operations ---

async function insertTask(values: {
  planId: string;
  title: string;
  instruction: string;
}): Promise<Task> {
  await ensureInit();
  const state = getState();
  const task: Task = {
    id: generateId(),
    planId: values.planId,
    title: values.title,
    instruction: values.instruction,
    status: "pending",
    result: null,
    browserbaseSessionId: null,
    liveViewUrl: null,
    startedAt: null,
    completedAt: null,
    createdAt: now(),
  };
  state.tasks.set(task.id, task);
  await persist("tasks");
  return task;
}

async function findTasksByPlanId(planId: string): Promise<Task[]> {
  await ensureInit();
  const state = getState();
  return Array.from(state.tasks.values()).filter((t) => t.planId === planId);
}

async function findTasksByStatus(status: TaskStatus): Promise<Task[]> {
  await ensureInit();
  const state = getState();
  return Array.from(state.tasks.values()).filter((t) => t.status === status);
}

async function updateTask(
  id: string,
  set: Partial<Omit<Task, "id" | "createdAt" | "planId">>,
  where?: { status?: TaskStatus }
): Promise<Task | null> {
  await ensureInit();
  const state = getState();
  const task = state.tasks.get(id);
  if (!task) return null;
  if (where?.status !== undefined && task.status !== where.status) return null;

  const updated: Task = {
    ...task,
    ...set,
    id: task.id,
    planId: task.planId,
    createdAt: task.createdAt,
  };
  state.tasks.set(id, updated);
  await persist("tasks");
  return updated;
}

// --- AgentEvent operations ---

async function insertAgentEvent(values: {
  planId: string;
  taskId: string;
  type: AgentEventType;
  data: unknown;
  sequenceNum: number;
}): Promise<AgentEvent> {
  await ensureInit();
  const state = getState();
  const event: AgentEvent = {
    id: generateId(),
    planId: values.planId,
    taskId: values.taskId,
    type: values.type,
    data: values.data,
    sequenceNum: values.sequenceNum,
    createdAt: now(),
  };
  state.agentEvents.set(event.id, event);
  await persist("agentEvents");
  return event;
}

async function insertManyAgentEvents(
  values: Array<{
    planId: string;
    taskId: string;
    type: AgentEventType;
    data: unknown;
    sequenceNum: number;
  }>
): Promise<AgentEvent[]> {
  await ensureInit();
  const state = getState();
  const timestamp = now();
  const events: AgentEvent[] = values.map((v) => ({
    id: generateId(),
    planId: v.planId,
    taskId: v.taskId,
    type: v.type,
    data: v.data,
    sequenceNum: v.sequenceNum,
    createdAt: timestamp,
  }));
  for (const e of events) {
    state.agentEvents.set(e.id, e);
  }
  await persist("agentEvents");
  return events;
}

async function findAgentEventById(id: string): Promise<AgentEvent | null> {
  await ensureInit();
  const state = getState();
  return state.agentEvents.get(id) ?? null;
}

async function findAgentEventsByPlanId(
  planId: string,
  opts?: { afterCreatedAt?: string; orderByCreatedAtAsc?: boolean }
): Promise<AgentEvent[]> {
  await ensureInit();
  const state = getState();
  let events = Array.from(state.agentEvents.values()).filter(
    (e) => e.planId === planId
  );

  if (opts?.afterCreatedAt) {
    const threshold = opts.afterCreatedAt;
    events = events.filter((e) => e.createdAt > threshold);
  }

  if (opts?.orderByCreatedAtAsc) {
    events.sort((a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt);
      if (cmp !== 0) return cmp;
      return a.id.localeCompare(b.id);
    });
  }

  return events;
}

async function getMaxSequenceNum(
  taskIds: string[]
): Promise<Map<string, number>> {
  await ensureInit();
  const state = getState();
  const taskIdSet = new Set(taskIds);
  const result = new Map<string, number>();

  for (const event of state.agentEvents.values()) {
    if (!taskIdSet.has(event.taskId)) continue;
    const current = result.get(event.taskId);
    if (current === undefined || event.sequenceNum > current) {
      result.set(event.taskId, event.sequenceNum);
    }
  }

  return result;
}

// --- Public API ---

export const storage = {
  sessions: {
    insert: insertSession,
    findById: findSessionById,
    findAll: findAllSessions,
  },
  plans: {
    insert: insertPlan,
    findById: findPlanById,
    update: updatePlan,
  },
  tasks: {
    insert: insertTask,
    findByPlanId: findTasksByPlanId,
    findByStatus: findTasksByStatus,
    update: updateTask,
  },
  agentEvents: {
    insert: insertAgentEvent,
    insertMany: insertManyAgentEvents,
    findById: findAgentEventById,
    findByPlanId: findAgentEventsByPlanId,
    getMaxSequenceNum,
  },
};
