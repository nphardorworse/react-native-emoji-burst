import type { EmojiBurstConfig } from "../types";

export const DEFAULT_CONFIG: EmojiBurstConfig = {
  emojis: ["💪", "🏋️", "👏", "🐐", "🔥"],
  maxParticles: 200,
  particlesPerBurst: 12,
  emojiSize: 32,
  origin: { region: { x: 0, y: 0, width: 0, height: 0 } },
  gravity: 980,
  initialVelocityY: [400, 800],
  initialVelocityX: [-200, 200],
  scaleRange: [0.6, 1.2],
  rotationSpeedRange: [-3, 3],
  lifetime: 2.5,
  fadeOutAfter: 1.5,
};

export function mergeConfig(
  props: Partial<EmojiBurstConfig>
): EmojiBurstConfig {
  // Strip undefined values so they don't override defaults via spread.
  // Destructured-but-not-passed props are undefined in the consumer.
  const defined = Object.fromEntries(
    Object.entries(props).filter(([, v]) => v !== undefined)
  );
  const config = { ...DEFAULT_CONFIG, ...defined };
  // Clamp fadeOutAfter to be less than lifetime
  if (config.fadeOutAfter >= config.lifetime) {
    config.fadeOutAfter = Math.max(0, config.lifetime - 0.1);
  }
  return config;
}
