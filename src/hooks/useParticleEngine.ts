import { useCallback, useEffect, useRef } from "react";
import {
  useSharedValue,
  useFrameCallback,
  runOnUI,
} from "react-native-reanimated";
import {
  useRSXformBuffer,
  useRectBuffer,
  useColorBuffer,
} from "@shopify/react-native-skia";

import { PARTICLE_STRIDE, ParticleField, type EmojiBurstConfig, type BurstOptions } from "../types";
import { randomRange, randomInt } from "../utils/random";

// Config fields needed by worklets — excludes emojis[] to avoid
// serializing a string array to the UI thread on every frame.
type WorkletConfig = Omit<EmojiBurstConfig, "emojis">;

/**
 * Core particle engine.
 *
 * Manages a Float32Array object pool, runs physics each frame via
 * useFrameCallback, and outputs RSXform/Rect/Color buffers for Atlas.
 */
export function useParticleEngine(config: EmojiBurstConfig, emojiCount: number, active = true) {
  const { maxParticles } = config;

  // --- Pool: useSharedValue for thread-safe access across all worklets ---
  const pool = useSharedValue(new Float32Array(maxParticles * PARTICLE_STRIDE));

  // Resize pool when maxParticles changes
  const allocatedRef = useRef(maxParticles);
  useEffect(() => {
    if (maxParticles !== allocatedRef.current) {
      pool.value = new Float32Array(maxParticles * PARTICLE_STRIDE);
      allocatedRef.current = maxParticles;
    }
  }, [maxParticles, pool]);

  // Frame counter drives buffer reactivity
  const frameCounter = useSharedValue(0);
  // Track active particle count on UI thread
  const activeCount = useSharedValue(0);

  // Config as shared value — strip emojis[] since no worklet needs it
  const configS = useSharedValue<WorkletConfig>({} as WorkletConfig);
  const emojiCountS = useSharedValue(emojiCount);

  // Sync shared values via useEffect — Reanimated 4 requires worklet
  // runtime context for scheduleOnUI, which .value= triggers internally.
  useEffect(() => {
    const { emojis: _, ...workletConfig } = config;
    configS.value = workletConfig;
  }, [config, configS]);

  useEffect(() => {
    emojiCountS.value = emojiCount;
  }, [emojiCount, emojiCountS]);

  // --- Physics tick ---
  const frameCallback = useFrameCallback((frameInfo) => {
    "worklet";
    const dt = frameInfo.timeSincePreviousFrame;
    if (dt === null || dt <= 0) return;

    const dtSec = Math.min(dt / 1000, 0.05); // cap at 50ms
    const cfg = configS.value;
    const gravity = cfg.gravity;
    const lifetime = cfg.lifetime;
    const fadeOutAfter = cfg.fadeOutAfter;
    const fadeDuration = lifetime - fadeOutAfter;
    const p = pool.value;
    // Clamp to actual pool length to prevent OOB reads during resize
    const max = Math.min(cfg.maxParticles, Math.floor(p.length / PARTICLE_STRIDE));

    for (let i = 0; i < max; i++) {
      const base = i * PARTICLE_STRIDE;
      if (p[base + ParticleField.Active] === 0) continue;

      // Advance age
      const age = p[base + ParticleField.Age] + dtSec;
      p[base + ParticleField.Age] = age;

      // Kill if expired
      if (age >= lifetime) {
        p[base + ParticleField.Active] = 0;
        continue;
      }

      // Gravity
      p[base + ParticleField.VY] += gravity * dtSec;

      // Integrate position
      p[base + ParticleField.X] += p[base + ParticleField.VX] * dtSec;
      p[base + ParticleField.Y] += p[base + ParticleField.VY] * dtSec;

      // Rotate
      p[base + ParticleField.Rotation] +=
        p[base + ParticleField.RotationSpeed] * dtSec;

      // Fade
      if (age > fadeOutAfter && fadeDuration > 0) {
        p[base + ParticleField.Opacity] = Math.max(
          0,
          1.0 - (age - fadeOutAfter) / fadeDuration
        );
      }
    }

    // Count active particles and signal buffers to re-run
    let aliveCount = 0;
    for (let j = 0; j < max; j++) {
      if (p[j * PARTICLE_STRIDE + ParticleField.Active] !== 0) aliveCount++;
    }
    activeCount.value = aliveCount;
    frameCounter.value += 1;
  }, active);

  // useFrameCallback's second arg is autostart (one-time), not reactive.
  // Use setActive to respond to subsequent active prop changes.
  useEffect(() => {
    frameCallback.setActive(active);
  }, [active, frameCallback]);

  // --- RSXform buffer: position + scale + rotation ---
  const transforms = useRSXformBuffer(maxParticles, (val, i) => {
    "worklet";
    void frameCounter.value; // reactivity trigger
    const p = pool.value;
    const base = i * PARTICLE_STRIDE;

    if (base + PARTICLE_STRIDE > p.length || p[base + ParticleField.Active] === 0) {
      val.set(0, 0, -10000, -10000); // invisible, off-screen
      return;
    }

    const x = p[base + ParticleField.X];
    const y = p[base + ParticleField.Y];
    const scale = p[base + ParticleField.Scale];
    const rotation = p[base + ParticleField.Rotation];

    const scos = scale * Math.cos(rotation);
    const ssin = scale * Math.sin(rotation);

    // Pivot around center of emoji sprite
    const he = configS.value.emojiSize / 2;
    val.set(
      scos,
      ssin,
      x - scos * he + ssin * he,
      y - ssin * he - scos * he
    );
  });

  // --- Rect buffer: map each particle to its emoji sprite ---
  const sprites = useRectBuffer(maxParticles, (val, i) => {
    "worklet";
    void frameCounter.value;
    const p = pool.value;
    const base = i * PARTICLE_STRIDE;
    if (base + PARTICLE_STRIDE > p.length || p[base + ParticleField.Active] === 0) {
      val.setXYWH(0, 0, 0, 0);
      return;
    }
    const es = configS.value.emojiSize;
    const emojiIdx = p[base + ParticleField.EmojiIndex];
    val.setXYWH(emojiIdx * es, 0, es, es);
  });

  // --- Color buffer: opacity via alpha ---
  const colors = useColorBuffer(maxParticles, (color, i) => {
    "worklet";
    void frameCounter.value;
    const p = pool.value;
    const base = i * PARTICLE_STRIDE;
    const opacity = (base + PARTICLE_STRIDE > p.length || p[base + ParticleField.Active] === 0)
      ? 0
      : p[base + ParticleField.Opacity];
    // SkColor is Float32Array [r, g, b, a] in 0-1 range
    color[0] = 1;
    color[1] = 1;
    color[2] = 1;
    color[3] = opacity;
  });

  // --- Spawn worklet ---
  // Deps are all shared value refs (stable), so this callback is created once.
  const spawnWorklet = useCallback(
    (opts: BurstOptions) => {
      "worklet";
      const cfg = configS.value;
      const p = pool.value;
      const emojis = emojiCountS.value;
      // Clamp to actual pool length to prevent OOB during resize
      const max = Math.min(cfg.maxParticles, Math.floor(p.length / PARTICLE_STRIDE));
      const count = opts.count ?? cfg.particlesPerBurst;
      const intensity = opts.intensity ?? 1.0;
      const rawEmoji = opts.emojiIndex ?? -1;

      // Bounds-check emojiIndex against actual emoji count
      const fixedEmoji = rawEmoji >= 0
        ? Math.min(rawEmoji, Math.max(0, emojis - 1))
        : -1;

      // Resolve origin
      const origin = opts.origin ?? cfg.origin;
      let originX: number;
      let originY: number;
      const hasRegion = !!origin.region;

      if (origin.point) {
        originX = origin.point.x;
        originY = origin.point.y;
      } else if (origin.region) {
        originX = origin.region.x + origin.region.width / 2;
        originY = origin.region.y + origin.region.height / 2;
      } else {
        originX = 0;
        originY = 0;
      }

      // Shared init logic — eliminates the duplicated spawn block
      const initSlot = (base: number) => {
        let px = originX;
        let py = originY;
        if (hasRegion && origin.region) {
          px = randomRange(origin.region.x, origin.region.x + origin.region.width);
          py = randomRange(origin.region.y, origin.region.y + origin.region.height);
        }

        p[base + ParticleField.X] = px;
        p[base + ParticleField.Y] = py;
        p[base + ParticleField.VX] =
          randomRange(cfg.initialVelocityX[0], cfg.initialVelocityX[1]) * intensity;
        p[base + ParticleField.VY] =
          -randomRange(cfg.initialVelocityY[0], cfg.initialVelocityY[1]) * intensity;
        p[base + ParticleField.Scale] =
          randomRange(cfg.scaleRange[0], cfg.scaleRange[1]);
        p[base + ParticleField.Rotation] = randomRange(0, Math.PI * 2);
        p[base + ParticleField.RotationSpeed] =
          randomRange(cfg.rotationSpeedRange[0], cfg.rotationSpeedRange[1]);
        p[base + ParticleField.Opacity] = 1.0;
        p[base + ParticleField.EmojiIndex] =
          fixedEmoji >= 0 ? fixedEmoji : (emojis > 0 ? randomInt(0, emojis) : 0);
        p[base + ParticleField.Age] = 0;
        p[base + ParticleField.Active] = 1;
      };

      let spawned = 0;

      // First pass: fill dead slots
      for (let i = 0; i < max && spawned < count; i++) {
        const base = i * PARTICLE_STRIDE;
        if (p[base + ParticleField.Active] !== 0) continue;
        initSlot(base);
        spawned++;
      }

      // Second pass: if pool was full, recycle oldest particles
      if (spawned < count) {
        const remaining = count - spawned;
        for (let r = 0; r < remaining; r++) {
          let oldestIdx = -1;
          let oldestAge = -1;
          for (let i = 0; i < max; i++) {
            const base = i * PARTICLE_STRIDE;
            if (p[base + ParticleField.Active] === 0) continue;
            const age = p[base + ParticleField.Age];
            if (age > oldestAge) {
              oldestAge = age;
              oldestIdx = i;
            }
          }
          if (oldestIdx < 0) break;
          initSlot(oldestIdx * PARTICLE_STRIDE);
        }
      }

      // Signal buffers to update (needed when active=false and frame callback is paused)
      frameCounter.value += 1;
    },
    [configS, pool, emojiCountS, frameCounter]
  );

  // --- Clear worklet ---
  const clearWorklet = useCallback(() => {
    "worklet";
    const p = pool.value;
    const max = Math.min(configS.value.maxParticles, Math.floor(p.length / PARTICLE_STRIDE));
    for (let i = 0; i < max; i++) {
      p[i * PARTICLE_STRIDE + ParticleField.Active] = 0;
    }
    frameCounter.value += 1;
  }, [pool, configS, frameCounter]);

  // --- Public API ---
  const burst = useCallback(
    (options?: BurstOptions) => {
      runOnUI(spawnWorklet)(options ?? {});
    },
    [spawnWorklet]
  );

  const clear = useCallback(() => {
    runOnUI(clearWorklet)();
  }, [clearWorklet]);

  const getActiveCount = useCallback(() => {
    return activeCount.value;
  }, [activeCount]);

  return { transforms, sprites, colors, burst, clear, getActiveCount };
}
