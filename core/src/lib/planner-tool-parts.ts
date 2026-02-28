import type { UIMessage } from "ai";

export type ToolPartState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

export interface PlannerToolPart {
  partType: "static" | "dynamic";
  toolName: string;
  toolCallId: string;
  state: ToolPartState | string;
  input: unknown;
  output: unknown;
  errorText?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStaticToolName(type: string): string | null {
  if (!type.startsWith("tool-")) return null;
  const toolName = type.slice(5);
  return toolName.length > 0 ? toolName : null;
}

export function normalizePlannerToolPart(
  part: UIMessage["parts"][number],
): PlannerToolPart | null {
  if (!isRecord(part)) return null;
  const partObj = part as Record<string, unknown>;
  const type = partObj.type;
  if (typeof type !== "string") return null;

  const toolName =
    type === "dynamic-tool"
      ? typeof partObj.toolName === "string"
        ? partObj.toolName
        : null
      : readStaticToolName(type);

  if (!toolName) return null;

  const toolCallId = partObj.toolCallId;
  const state = partObj.state;
  if (typeof toolCallId !== "string" || typeof state !== "string") return null;

  return {
    partType: type === "dynamic-tool" ? "dynamic" : "static",
    toolName,
    toolCallId,
    state,
    input: partObj.input,
    output: partObj.output,
    errorText:
      typeof partObj.errorText === "string" ? partObj.errorText : undefined,
  };
}

export function findLatestPlannerToolPart(
  messages: UIMessage[],
  toolName: string,
): PlannerToolPart | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;

    for (let j = msg.parts.length - 1; j >= 0; j--) {
      const normalized = normalizePlannerToolPart(msg.parts[j]);
      if (!normalized) continue;
      if (normalized.toolName === toolName) return normalized;
    }
  }

  return null;
}

export function findLatestPlannerToolPartByState(
  messages: UIMessage[],
  toolName: string,
  states: Set<string>,
): PlannerToolPart | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;

    for (let j = msg.parts.length - 1; j >= 0; j--) {
      const normalized = normalizePlannerToolPart(msg.parts[j]);
      if (!normalized) continue;
      if (normalized.toolName !== toolName) continue;
      if (states.has(normalized.state)) {
        return normalized;
      }
      return null;
    }
  }

  return null;
}

export function findLatestPlannerToolFailure(
  messages: UIMessage[],
  toolNames: string[],
): PlannerToolPart | null {
  const toolNameSet = new Set(toolNames);

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;

    for (let j = msg.parts.length - 1; j >= 0; j--) {
      const normalized = normalizePlannerToolPart(msg.parts[j]);
      if (!normalized) continue;
      if (!toolNameSet.has(normalized.toolName)) continue;
      return normalized.state === "output-error" ||
        normalized.state === "output-denied"
        ? normalized
        : null;
    }
  }

  return null;
}

export function getOutputPlannerToolParts(
  parts: UIMessage["parts"],
): PlannerToolPart[] {
  return parts
    .map((part) => normalizePlannerToolPart(part))
    .filter(
      (part): part is PlannerToolPart =>
        part !== null && part.state === "output-available",
    );
}

export function getLastAssistantPlannerToolPartsDebug(
  messages: UIMessage[],
): Array<{
  toolCallId: string;
  toolName: string;
  state: string;
  partType: "static" | "dynamic";
}> {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;

    return msg.parts
      .map((part) => normalizePlannerToolPart(part))
      .filter((part): part is PlannerToolPart => part !== null)
      .map((part) => ({
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        state: part.state,
        partType: part.partType,
      }));
  }

  return [];
}
