import { create } from "zustand";
import type {
  TaskMode,
  PlanningStep,
  UploadedFile,
  ChatMessage,
  Credentials,
  PlanStep,
} from "@/types";

interface PlanningState {
  selectedMode: TaskMode | null;
  currentStep: PlanningStep;
  prompt: string;
  uploadedFiles: UploadedFile[];
  chatMessages: ChatMessage[];
  credentials: Credentials;
  planSteps: PlanStep[];
  planApproved: boolean;

  setMode: (mode: TaskMode) => void;
  setStep: (step: PlanningStep) => void;
  setPrompt: (prompt: string) => void;
  addFile: (file: UploadedFile) => void;
  removeFile: (id: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  setCredentials: (credentials: Partial<Credentials>) => void;
  setPlanSteps: (steps: PlanStep[]) => void;
  approvePlan: () => void;
  reset: () => void;
}

const initialCredentials: Credentials = {
  url: "",
  username: "",
  password: "",
};

export const usePlanningStore = create<PlanningState>((set) => ({
  selectedMode: null,
  currentStep: "mode",
  prompt: "",
  uploadedFiles: [],
  chatMessages: [],
  credentials: initialCredentials,
  planSteps: [],
  planApproved: false,

  setMode: (mode) => set({ selectedMode: mode, currentStep: "prompt" }),
  setStep: (step) => set({ currentStep: step }),
  setPrompt: (prompt) => set({ prompt }),
  addFile: (file) =>
    set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),
  removeFile: (id) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
    })),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  setCredentials: (credentials) =>
    set((state) => ({
      credentials: { ...state.credentials, ...credentials },
    })),
  setPlanSteps: (steps) => set({ planSteps: steps }),
  approvePlan: () => set({ planApproved: true }),
  reset: () =>
    set({
      selectedMode: null,
      currentStep: "mode",
      prompt: "",
      uploadedFiles: [],
      chatMessages: [],
      credentials: initialCredentials,
      planSteps: [],
      planApproved: false,
    }),
}));
