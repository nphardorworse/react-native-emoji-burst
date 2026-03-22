import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { Canvas, Atlas } from "@shopify/react-native-skia";

import type { EmojiBurstProps, EmojiBurstRef, BurstOptions } from "./types";
import { useEmojiTexture } from "./hooks/useEmojiTexture";
import { useParticleEngine } from "./hooks/useParticleEngine";
import { mergeConfig } from "./utils/physics";

// Outer wrapper: keys on maxParticles so Skia Atlas buffers (which cannot
// be dynamically resized) are recreated when the pool size changes.
export const EmojiBurst = forwardRef<EmojiBurstRef, EmojiBurstProps>(
  (props, ref) => (
    <EmojiBurstInner key={props.maxParticles} {...props} ref={ref} />
  )
);
EmojiBurst.displayName = "EmojiBurst";

const EmojiBurstInner = forwardRef<EmojiBurstRef, EmojiBurstProps>(
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
    // re-rasterization from inline array literals like emojis={['💪','🔥']}.
    // Uses useMemo (not bare ref mutation) so it's safe under concurrent rendering.
    const stableEmojisRef = useRef(config.emojis);
    const stableEmojis = useMemo(() => {
      const prev = stableEmojisRef.current;
      if (
        config.emojis.length !== prev.length ||
        config.emojis.some((e, i) => e !== prev[i])
      ) {
        stableEmojisRef.current = config.emojis;
        return config.emojis;
      }
      return prev;
    }, [config.emojis]);

    const { texture, emojiCount } = useEmojiTexture(
      stableEmojis,
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
