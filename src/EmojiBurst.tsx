import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { Canvas, Atlas } from "@shopify/react-native-skia";

import type { EmojiBurstProps, EmojiBurstRef, BurstOptions } from "./types";
import { useEmojiTexture } from "./hooks/useEmojiTexture";
import { useParticleEngine } from "./hooks/useParticleEngine";
import { mergeConfig } from "./utils/physics";

export const EmojiBurst = forwardRef<EmojiBurstRef, EmojiBurstProps>(
  (props, ref) => {
    const {
      style,
      active = true,
      emojis,
      maxParticles,
      particlesPerBurst,
      emojiSize,
      origin,
      gravity,
      initialVelocityY,
      initialVelocityX,
      scaleRange,
      rotationSpeedRange,
      lifetime,
      fadeOutAfter,
    } = props;

    const config = useMemo(
      () =>
        mergeConfig({
          emojis,
          maxParticles,
          particlesPerBurst,
          emojiSize,
          origin,
          gravity,
          initialVelocityY,
          initialVelocityX,
          scaleRange,
          rotationSpeedRange,
          lifetime,
          fadeOutAfter,
        }),
      [
        emojis,
        maxParticles,
        particlesPerBurst,
        emojiSize,
        origin,
        gravity,
        initialVelocityY,
        initialVelocityX,
        scaleRange,
        rotationSpeedRange,
        lifetime,
        fadeOutAfter,
      ]
    );

    // Stabilize emojis array reference to prevent unnecessary atlas
    // re-rasterization from inline array literals like emojis={['💪','🔥']}
    const prevEmojisRef = useRef(config.emojis);
    if (
      config.emojis.length !== prevEmojisRef.current.length ||
      config.emojis.some((e, i) => e !== prevEmojisRef.current[i])
    ) {
      prevEmojisRef.current = config.emojis;
    }

    const { texture, emojiCount } = useEmojiTexture(
      prevEmojisRef.current,
      config.emojiSize
    );
    const { transforms, sprites, colors, burst, clear, getActiveCount } =
      useParticleEngine(config, emojiCount, active);

    useImperativeHandle(
      ref,
      () => ({
        burst: (options?: BurstOptions) => burst(options),
        clear,
        getActiveCount,
      }),
      [burst, clear, getActiveCount]
    );

    return (
      <Canvas
        style={[StyleSheet.absoluteFill, style]}
        pointerEvents="none"
      >
        <Atlas
          image={texture}
          sprites={sprites}
          transforms={transforms}
          colors={colors}
          colorBlendMode="modulate"
        />
      </Canvas>
    );
  }
);

EmojiBurst.displayName = "EmojiBurst";
