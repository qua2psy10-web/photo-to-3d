import { dummyProvider } from "./dummy";
import { localProvider } from "./local";
import { tripoProvider } from "./tripo";
import type { ReconstructionProvider } from "./types";

export type { ReconstructionProvider, CreateTaskInput, GetTaskResult } from "./types";
export { dummyProvider } from "./dummy";
export { localProvider } from "./local";
export { tripoProvider } from "./tripo";

export function getReconstructionProvider(): ReconstructionProvider {
  const name = (process.env.RECONSTRUCTION_PROVIDER ?? "local").toLowerCase();
  switch (name) {
    case "dummy":
      return dummyProvider;
    case "local":
      return localProvider;
    case "tripo":
      return tripoProvider;
    case "meshy":
      console.warn(
        `[providers] RECONSTRUCTION_PROVIDER=meshy is paused; using local`,
      );
      return localProvider;
    default:
      console.warn(
        `[providers] Unknown RECONSTRUCTION_PROVIDER="${name}", falling back to local`,
      );
      return localProvider;
  }
}
