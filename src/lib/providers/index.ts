import { dummyProvider } from "./dummy";
import { tripoProvider } from "./tripo";
import type { ReconstructionProvider } from "./types";

export type { ReconstructionProvider, CreateTaskInput, GetTaskResult } from "./types";
export { dummyProvider } from "./dummy";
export { tripoProvider } from "./tripo";

export function getReconstructionProvider(): ReconstructionProvider {
  const name = (process.env.RECONSTRUCTION_PROVIDER ?? "dummy").toLowerCase();
  switch (name) {
    case "dummy":
      return dummyProvider;
    case "tripo":
      return tripoProvider;
    default:
      console.warn(
        `[providers] Unknown RECONSTRUCTION_PROVIDER="${name}", falling back to dummy`,
      );
      return dummyProvider;
  }
}
