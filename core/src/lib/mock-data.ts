import type { ChatMessage, PlanStep, Agent, AgentLogEntry } from "@/types";

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    role: "user",
    content:
      "I need to test the checkout flow on our e-commerce site across 5 different user scenarios.",
    timestamp: new Date("2026-02-28T10:00:00"),
  },
  {
    id: "msg-2",
    role: "assistant",
    content:
      "I can help you set up parallel testing for the checkout flow. I'll create 5 agents, each handling a different scenario:\n\n1. Guest checkout with credit card\n2. Registered user with saved payment\n3. Checkout with discount code\n4. International shipping address\n5. Multi-item cart with mixed availability\n\nEach agent will navigate the checkout independently. Should I also include error-state testing (expired card, invalid address)?",
    timestamp: new Date("2026-02-28T10:00:15"),
  },
  {
    id: "msg-3",
    role: "user",
    content:
      "Yes, add error states too. Also make sure each agent captures screenshots at every step.",
    timestamp: new Date("2026-02-28T10:01:00"),
  },
  {
    id: "msg-4",
    role: "assistant",
    content:
      "Got it. I'll expand to 7 agents (adding expired card and invalid address scenarios) and configure screenshot capture at each checkout step. I've also added credential requirements - you'll need to provide the staging site URL and test account credentials. Ready to review the plan?",
    timestamp: new Date("2026-02-28T10:01:20"),
  },
];

export const MOCK_PLAN_STEPS: PlanStep[] = [
  {
    id: "step-1",
    title: "Guest Checkout - Credit Card",
    description:
      "Navigate to product page, add to cart, proceed as guest, enter shipping details, pay with credit card, verify confirmation.",
    agentCount: 1,
  },
  {
    id: "step-2",
    title: "Registered User - Saved Payment",
    description:
      "Log in with test account, add items to cart, use saved payment method, verify order history update.",
    agentCount: 1,
  },
  {
    id: "step-3",
    title: "Discount Code Checkout",
    description:
      "Add items to cart, apply discount code SAVE20, verify price calculation, complete checkout.",
    agentCount: 1,
  },
  {
    id: "step-4",
    title: "International Shipping",
    description:
      "Select international product, enter UK shipping address, verify tax calculation and shipping options.",
    agentCount: 1,
  },
  {
    id: "step-5",
    title: "Multi-Item Mixed Availability",
    description:
      "Add in-stock and pre-order items, verify split shipping notice, complete checkout with mixed fulfillment.",
    agentCount: 1,
  },
  {
    id: "step-6",
    title: "Error State - Expired Card",
    description:
      "Attempt checkout with expired card details, verify error message and recovery flow.",
    agentCount: 1,
  },
  {
    id: "step-7",
    title: "Error State - Invalid Address",
    description:
      "Enter malformed shipping address, verify validation messages and correction prompts.",
    agentCount: 1,
  },
];

function createLogEntries(prefix: string, count: number): AgentLogEntry[] {
  const actions = [
    { action: "Navigating", detail: "Opening target URL in browser" },
    { action: "Clicking", detail: "Found and clicking 'Add to Cart' button" },
    { action: "Filling form", detail: "Entering shipping address fields" },
    { action: "Waiting", detail: "Page loading after form submission" },
    { action: "Verifying", detail: "Checking confirmation page elements" },
    { action: "Screenshot", detail: "Captured checkout step screenshot" },
    { action: "Asserting", detail: "Verifying order total matches expected" },
    { action: "Completing", detail: "Final verification passed" },
  ];

  return actions.slice(0, count).map((a, i) => ({
    id: `${prefix}-log-${i}`,
    timestamp: new Date(Date.now() - (count - i) * 30000),
    action: a.action,
    detail: a.detail,
  }));
}

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "Agent 1",
    taskDescription: "Guest Checkout - Credit Card",
    status: "running",
    progress: 65,
    logs: createLogEntries("a1", 5),
    startedAt: new Date(Date.now() - 120000),
    completedAt: null,
  },
  {
    id: "agent-2",
    name: "Agent 2",
    taskDescription: "Registered User - Saved Payment",
    status: "running",
    progress: 40,
    logs: createLogEntries("a2", 3),
    startedAt: new Date(Date.now() - 90000),
    completedAt: null,
  },
  {
    id: "agent-3",
    name: "Agent 3",
    taskDescription: "Discount Code Checkout",
    status: "completed",
    progress: 100,
    logs: createLogEntries("a3", 8),
    startedAt: new Date(Date.now() - 180000),
    completedAt: new Date(Date.now() - 30000),
  },
  {
    id: "agent-4",
    name: "Agent 4",
    taskDescription: "International Shipping",
    status: "running",
    progress: 20,
    logs: createLogEntries("a4", 2),
    startedAt: new Date(Date.now() - 60000),
    completedAt: null,
  },
  {
    id: "agent-5",
    name: "Agent 5",
    taskDescription: "Multi-Item Mixed Availability",
    status: "idle",
    progress: 0,
    logs: [],
    startedAt: null,
    completedAt: null,
  },
  {
    id: "agent-6",
    name: "Agent 6",
    taskDescription: "Error State - Expired Card",
    status: "failed",
    progress: 55,
    logs: createLogEntries("a6", 4),
    startedAt: new Date(Date.now() - 150000),
    completedAt: null,
  },
  {
    id: "agent-7",
    name: "Agent 7",
    taskDescription: "Error State - Invalid Address",
    status: "running",
    progress: 80,
    logs: createLogEntries("a7", 6),
    startedAt: new Date(Date.now() - 100000),
    completedAt: null,
  },
];
