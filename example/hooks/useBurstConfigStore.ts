import { createContext, useContext } from "react";
import type { BurstConfig } from "./useBurstConfig";

interface BurstConfigStore {
  config: BurstConfig;
  updateField: <K extends keyof BurstConfig>(key: K, value: BurstConfig[K]) => void;
  resetToDefaults: () => void;
}

export const BurstConfigContext = createContext<BurstConfigStore | null>(null);

export const useBurstConfigStore = (): BurstConfigStore => {
  const ctx = useContext(BurstConfigContext);
  if (!ctx) throw new Error("useBurstConfigStore must be inside BurstConfigProvider");
  return ctx;
};
