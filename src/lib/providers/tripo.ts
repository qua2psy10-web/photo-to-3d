import type { Job } from "@/lib/types";
import type {
  CreateTaskInput,
  GetTaskResult,
  ReconstructionProvider,
} from "./types";

/**
 * Tripo stub — not configured in Week2 vessel.
 * Live Tripo pay-as-you-go calls come later; do not call any paid API here.
 */
export const tripoProvider: ReconstructionProvider = {
  name: "tripo",

  async createTask(input: CreateTaskInput): Promise<{ providerTaskId?: string }> {
    void input;
    throw new Error(
      "Tripo provider is not configured. Set RECONSTRUCTION_PROVIDER=dummy for local vessel, or wire Tripo API keys later.",
    );
  },

  async getTask(job: Job): Promise<GetTaskResult> {
    void job;
    return {
      status: "failed",
      progress: 0,
      errorMessage:
        "Tripo provider is not configured. Reconstruction stays on the dummy vessel until Tripo is wired.",
    };
  },
};
