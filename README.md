# react-native-emoji-burst

Performant emoji particle burst animations for React Native. Think Instagram reactions, confetti cannons, or celebration effects — but with emoji.

Built on [Skia Atlas API](https://shopify.github.io/react-native-skia/docs/shapes/atlas/) for maximum performance. All particles render in a **single GPU draw call** regardless of count. Physics run entirely on the UI thread via Reanimated worklets — no JS thread involvement during animation.

**Supports iOS and Android.** Compatible with Expo SDK 55+.

<table>
  <tr>
    <td align="center"><strong>Emoji Burst</strong></td>
    <td align="center"><strong>Settings + Customization</strong></td>
  </tr>
  <tr>
    <td>
      <video src="https://github.com/user-attachments/assets/53fb0000-0ab4-4351-a955-66ab020356c3" width="300" controls></video>
    </td>
    <td>
      <video src="https://github.com/user-attachments/assets/01ed6815-756d-4572-bc89-ea1fba92a4b7" width="300" controls></video>
    </td>
  </tr>
</table>

## Features

- Single GPU draw call for all particles (Skia Atlas)
- UI-thread physics via Reanimated worklets (60fps)
- Object pool with zero GC pressure (Float32Array)
- Configurable gravity, velocity, scale, rotation, fade
- Burst from a point or a random region
- Burst a specific emoji or random from set
- Adaptive pooling (gracefully recycles oldest particles when pool is full)

## Installation

```bash
npx expo install react-native-emoji-burst @shopify/react-native-skia react-native-reanimated react-native-worklets
```

Or with npm/yarn:

```bash
npm install react-native-emoji-burst @shopify/react-native-skia react-native-reanimated react-native-worklets
# or
yarn add react-native-emoji-burst @shopify/react-native-skia react-native-reanimated react-native-worklets
```

### Peer Dependencies

| Package | Version |
|---------|---------|
| `@shopify/react-native-skia` | `>= 2.5.0` |
| `react-native-reanimated` | `>= 4.0.0` |
| `react-native-worklets` | `>= 0.7.0` |
| `react` | `>= 19.0.0` |
| `react-native` | `>= 0.78.0` |

### Babel Configuration

**Expo SDK 55+**: No `babel.config.js` needed — `babel-preset-expo` automatically includes the worklets plugin when `react-native-worklets` is installed.

**Without Expo** or for explicit configuration, add the worklets plugin to your `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
```

This is required because the library uses Reanimated worklets that are compiled at build time by the Babel plugin.

### Expo 55 and Skia Version

Expo SDK 55 ships `@shopify/react-native-skia@2.4.18` by default. This version has a bug in Skia's paragraph rendering pipeline that prevents color emoji from appearing in Atlas textures — emoji particles render as white squares instead.

To fix this, install Skia 2.5+ explicitly after `npx expo install`:

```bash
npx expo install @shopify/react-native-skia@^2.5.3
```

Skia 2.5.3 is fully compatible with Expo 55, React Native 0.83, and Reanimated 4.2 — only the emoji rendering pipeline changed.

### Monorepo Setup

If you're using a monorepo (e.g., a library with an `example/` app), add `react-native-worklets` to your Metro shared dependencies to prevent duplicate module instances:

```js
// metro.config.js
const sharedDeps = [
  "react",
  "react-native",
  "react-native-reanimated",
  "react-native-worklets",
  "@shopify/react-native-skia",
];
```

## Quick Start

```tsx
import { useRef } from 'react';
import { View, Button } from 'react-native';
import { EmojiBurst, type EmojiBurstRef } from 'react-native-emoji-burst';

export default function App() {
  const burstRef = useRef<EmojiBurstRef>(null);

  return (
    <View style={{ flex: 1 }}>
      <Button
        title="Burst!"
        onPress={() => burstRef.current?.burst()}
      />

      <EmojiBurst
        ref={burstRef}
        emojis={['🎉', '🔥', '❤️', '🎈', '🤩']}
      />
    </View>
  );
}
```

The `<EmojiBurst>` component renders a full-screen transparent overlay (`pointerEvents="none"`) on top of your content. It does not intercept touches.

## API Reference

### `<EmojiBurst>` Props

All props are optional. Sensible defaults are provided.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ref` | `EmojiBurstRef` | — | Ref to imperatively trigger bursts |
| `emojis` | `string[]` | `['💪','🏋️','👏','🐐','🔥']` | Emoji characters to use |
| `particlesPerBurst` | `number` | `12` | Particles spawned per `burst()` call |
| `maxParticles` | `number` | `200` | Max simultaneous particles (pool size) |
| `emojiSize` | `number` | `32` | Render size of each emoji in points |
| `gravity` | `number` | `980` | Downward acceleration in points/sec^2 |
| `initialVelocityY` | `[min, max]` | `[400, 800]` | Upward launch speed range (points/sec) |
| `initialVelocityX` | `[min, max]` | `[-200, 200]` | Horizontal spread range (points/sec) |
| `scaleRange` | `[min, max]` | `[0.6, 1.2]` | Random scale factor per particle |
| `rotationSpeedRange` | `[min, max]` | `[-3, 3]` | Rotation speed in radians/sec |
| `lifetime` | `number` | `2.5` | Particle lifetime in seconds |
| `fadeOutAfter` | `number` | `1.5` | Seconds before fade-out begins |
| `origin` | `BurstOrigin` | — | Default burst origin (point or region) |
| `active` | `boolean` | `true` | Whether the engine processes frames |
| `style` | `ViewStyle` | — | Style for the Canvas overlay |

### `EmojiBurstRef` Methods

Access these via a React ref:

```tsx
const burstRef = useRef<EmojiBurstRef>(null);
```

#### `burst(options?: BurstOptions)`

Trigger a burst of emoji particles.

```tsx
burstRef.current?.burst({
  count: 20,                    // override particlesPerBurst
  origin: { point: { x: 200, y: 400 } },  // burst from a specific point
  intensity: 1.5,               // speed multiplier
  emojiIndex: 2,                // use only the 3rd emoji (0-indexed)
});
```

All fields in `BurstOptions` are optional — omitted fields use the component prop defaults.

#### `clear()`

Immediately remove all active particles.

```tsx
burstRef.current?.clear();
```

#### `getActiveCount()`

Returns the current number of live particles on screen.

```tsx
const count = burstRef.current?.getActiveCount();
```

## Burst Origin

Control where particles spawn from. Two modes:

### Point Origin

Burst from a single coordinate. Great for button reactions:

```tsx
burstRef.current?.burst({
  origin: { point: { x: 200, y: 400 } },
});
```

### Region Origin

Particles spawn at random positions within a rectangle. Great for screen-wide effects:

```tsx
burstRef.current?.burst({
  origin: {
    region: {
      x: 0,              // left edge
      y: screenHeight * 0.3,
      width: screenWidth,  // full width
      height: 100,
    },
  },
});
```

You can also set a default origin via the component prop:

```tsx
<EmojiBurst
  origin={{
    region: {
      x: 50,
      y: 600,
      width: 300,
      height: 50,
    },
  }}
/>
```

## Changing Emojis

### Set emojis via props

Pass any array of emoji strings. The component rasterizes them into a texture atlas at mount time:

```tsx
<EmojiBurst emojis={['🏀', '⚽', '🏈', '🎾']} />
```

Updating the `emojis` prop triggers a re-rasterization (async, ~1 frame delay). The new emojis appear on the next burst.

### Burst a specific emoji

Use the `emojiIndex` option in `burst()` to spawn only one emoji. The index is 0-based, matching the order of the `emojis` array:

```tsx
const EMOJIS = ['🏀', '⚽', '🏈', '🎾'];

// Burst only soccer balls
burstRef.current?.burst({ emojiIndex: 1 });

// Burst only basketballs
burstRef.current?.burst({ emojiIndex: 0 });

// Omit emojiIndex for random selection from the full set
burstRef.current?.burst();
```

### Emoji rendering notes

- **iOS**: Uses Apple Color Emoji font (built-in)
- **Android**: Uses Noto Color Emoji font (built-in)
- Emojis are pre-rasterized into a Skia texture atlas using the Paragraph API
- Compound emojis (skin tones, ZWJ sequences) are supported
- **Web is not supported** — this library targets iOS and Android only

## Tuning Physics

### Gravity

Controls how fast particles fall. Set to `0` for floating particles:

```tsx
<EmojiBurst gravity={0} />       // no gravity — particles float
<EmojiBurst gravity={500} />     // gentle fall
<EmojiBurst gravity={980} />     // earth-like (default)
<EmojiBurst gravity={2000} />    // heavy, fast fall
```

### Velocity

`initialVelocityY` controls upward launch speed. `initialVelocityX` controls horizontal spread:

```tsx
// Tall narrow fountain
<EmojiBurst
  initialVelocityY={[800, 1200]}
  initialVelocityX={[-50, 50]}
/>

// Wide low spread
<EmojiBurst
  initialVelocityY={[200, 400]}
  initialVelocityX={[-500, 500]}
/>
```

### Scale and rotation

```tsx
// Tiny fast-spinning particles
<EmojiBurst scaleRange={[0.3, 0.5]} rotationSpeedRange={[-8, 8]} />

// Large slow-spinning particles
<EmojiBurst scaleRange={[1.5, 2.5]} rotationSpeedRange={[-1, 1]} />
```

### Lifetime and fading

`lifetime` is total time before a particle is removed. `fadeOutAfter` is when the fade-out begins:

```tsx
// Quick flash (0.5s visible, then 0.5s fade)
<EmojiBurst lifetime={1} fadeOutAfter={0.5} />

// Long-lasting (visible for 3s, then 2s fade)
<EmojiBurst lifetime={5} fadeOutAfter={3} />
```

If `fadeOutAfter >= lifetime`, it is automatically clamped so particles always fade before disappearing.

## Performance

### How it works

1. **Emoji rasterization**: At mount, all emojis are rendered into a single horizontal texture atlas using Skia's Paragraph API
2. **Object pool**: A `Float32Array` stores all particle state (position, velocity, scale, rotation, opacity, etc.) — 48 bytes per particle, zero GC pressure
3. **Physics**: A Reanimated `useFrameCallback` worklet runs gravity + integration every frame on the UI thread
4. **Rendering**: Skia's `Atlas` component draws all particles in one GPU draw call using `useRSXformBuffer`, `useRectBuffer`, and `useColorBuffer`

### Particle pool behavior

The pool has a fixed size (`maxParticles`, default 200). When you call `burst()`:

- If free slots exist, new particles fill them
- If the pool is full, the **oldest** particles are recycled

This means:

- **Fast device / normal tapping**: Particles complete their lifetime before the pool fills. Every burst creates fresh particles (additive).
- **Slow device / rapid tapping**: Pool fills up, oldest (least visible) particles get recycled. Graceful degradation without frame drops.

### Tuning for your use case

| Scenario | Recommended `maxParticles` |
|----------|---------------------------|
| Subtle reactions (1-2 taps) | 50–100 |
| Moderate celebrations | 100–200 |
| Rapid-fire spam (Instagram-style) | 200–400 |
| Stress test / demo | 400–500 |

### Pausing

Set `active={false}` to pause the physics engine. Particles freeze in place. Set back to `true` to resume:

```tsx
<EmojiBurst active={!isPaused} />
```

## TypeScript

All types are exported:

```tsx
import type {
  EmojiBurstProps,
  EmojiBurstRef,
  EmojiBurstConfig,
  BurstOptions,
  BurstOrigin,
  BurstOriginPoint,
  BurstOriginRegion,
} from 'react-native-emoji-burst';
```

## Example App

The `example/` directory contains a full Expo app demonstrating:

- Emoji picker row (tap to burst a specific emoji from button position)
- Tap-anywhere screen burst (random emojis from configurable region)
- Settings modal with sliders for every parameter

To run:

```bash
cd example
npm install
npx expo run:ios     # iOS
npx expo run:android # Android
```

## Architecture

```
EmojiBurst.tsx                 Main component (Canvas + Atlas overlay)
  hooks/useEmojiTexture.tsx    Emoji -> Skia texture atlas (Paragraph API)
  hooks/useParticleEngine.ts   Float32Array pool + physics + Atlas buffers
  utils/physics.ts             Default config + merge
  utils/random.ts              Worklet-safe random helpers
  types.ts                     All TypeScript interfaces
```

## License

MIT
