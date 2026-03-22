import type { StyleProp, ViewStyle } from "react-native";

// --- Burst origin ---

export interface BurstOriginPoint {
  x: number;
  y: number;
}

export interface BurstOriginRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BurstOrigin {
  point?: BurstOriginPoint;
  region?: BurstOriginRegion;
}

// --- Burst options (per-call overrides) ---

export interface BurstOptions {
  /** Number of particles to spawn. Overrides component prop. */
  count?: number;
  /** Origin point or region for this burst. Overrides component prop. */
  origin?: BurstOrigin;
  /** Initial speed multiplier (default 1.0) */
  intensity?: number;
  /** Index of a specific emoji to use (0-based). Omit for random selection. */
  emojiIndex?: number;
}

// --- Component config ---

export interface EmojiBurstConfig {
  emojis: string[];
  maxParticles: number;
  particlesPerBurst: number;
  emojiSize: number;
  origin: BurstOrigin;
  gravity: number;
  /** Upward velocity range [min, max] in points/sec */
  initialVelocityY: [number, number];
  /** Horizontal velocity range [min, max] in points/sec */
  initialVelocityX: [number, number];
  /** Scale range [min, max] */
  scaleRange: [number, number];
  /** Rotation speed range in radians/sec */
  rotationSpeedRange: [number, number];
  /** Total particle lifetime in seconds */
  lifetime: number;
  /** Seconds before particle starts fading out */
  fadeOutAfter: number;
}

// --- Component props ---

export type EmojiBurstProps = Partial<EmojiBurstConfig> & {
  style?: StyleProp<ViewStyle>;
  /** Whether the engine processes frames (default: true) */
  active?: boolean;
};

// --- Ref ---

export interface EmojiBurstRef {
  burst: (options?: BurstOptions) => void;
  clear: () => void;
  getActiveCount: () => number;
}

// --- Internal: particle memory layout ---

export const PARTICLE_STRIDE = 11;

export const ParticleField = {
  X: 0,
  Y: 1,
  VX: 2,
  VY: 3,
  Scale: 4,
  Rotation: 5,
  RotationSpeed: 6,
  Opacity: 7,
  EmojiIndex: 8,
  Age: 9,
  Active: 10,
} as const;
