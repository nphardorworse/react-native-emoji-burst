import { useState, useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";

export interface BurstConfig {
  particlesPerBurst: number;
  maxParticles: number;
  emojiSize: number;
  gravity: number;
  initialVelocityYMin: number;
  initialVelocityYMax: number;
  initialVelocityXMin: number;
  initialVelocityXMax: number;
  scaleMin: number;
  scaleMax: number;
  rotationSpeedMin: number;
  rotationSpeedMax: number;
  lifetime: number;
  fadeOutAfter: number;
  originXMin: number;
  originXMax: number;
  originYMin: number;
  originYMax: number;
}

export const useDefaultConfig = (): BurstConfig => {
  const { width, height } = useWindowDimensions();
  return useMemo(
    () => ({
      particlesPerBurst: 12,
      maxParticles: 200,
      emojiSize: 36,
      gravity: 980,
      initialVelocityYMin: 400,
      initialVelocityYMax: 900,
      initialVelocityXMin: -300,
      initialVelocityXMax: 300,
      scaleMin: 0.5,
      scaleMax: 1.4,
      rotationSpeedMin: -3,
      rotationSpeedMax: 3,
      lifetime: 2.5,
      fadeOutAfter: 1.5,
      originXMin: Math.round(width * 0.1),
      originXMax: Math.round(width * 0.9),
      originYMin: Math.round(height * 0.2),
      originYMax: Math.round(height * 0.5),
    }),
    [width, height]
  );
};

export const useBurstConfig = () => {
  const defaults = useDefaultConfig();
  const [config, setConfig] = useState<BurstConfig>(defaults);

  const updateField = useCallback(
    <K extends keyof BurstConfig>(key: K, value: BurstConfig[K]) => {
      setConfig((prev) => {
        const next = { ...prev, [key]: value };
        // Clamp fadeOutAfter when lifetime decreases below it
        if (key === "lifetime" && next.fadeOutAfter >= (value as number)) {
          next.fadeOutAfter = Math.max(0, (value as number) - 0.1);
        }
        return next;
      });
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    setConfig(defaults);
  }, [defaults]);

  return { config, updateField, resetToDefaults };
};
