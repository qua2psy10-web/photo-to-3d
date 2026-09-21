import { MESSAGES } from "@/lib/messages";
import type { Job } from "@/lib/types";
import type {
  CreateTaskInput,
  GetTaskResult,
  ReconstructionProvider,
} from "./types";

/**
 * Tripo stub — paid API is out of scope for this product slice.
 * Selecting RECONSTRUCTION_PROVIDER=tripo fails in Japanese without network calls.
 */
export const tripoProvider: ReconstructionProvider = {
  name: "tripo",

  async createTask(input: CreateTaskInput): Promise<{ providerTaskId?: string }> {
    void input;
    throw new Error(MESSAGES.provider_not_configured);
  },

  async getTask(job: Job): Promise<GetTaskResult> {
    void job;
    return {
      status: "failed",
      progress: 0,
      errorMessage: MESSAGES.provider_not_configured,
    };
  },
};
