import { memo, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type PressableStateCallbackType,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmojiBurst, type EmojiBurstRef } from "react-native-emoji-burst";
import { useBurstConfigStore } from "../hooks/useBurstConfigStore";

const EMOJIS = ["💪", "🏋️", "👏", "🐐", "🔥"];

// --- Extracted component to avoid arrow functions in JSX ---

interface EmojiButtonProps {
  emoji: string;
  index: number;
  onPress: (e: GestureResponderEvent, index: number) => void;
}

const getButtonStyle = ({ pressed }: PressableStateCallbackType) => [
  styles.emojiButton,
  pressed && styles.emojiButtonPressed,
];

const EmojiButton = memo(({ emoji, index, onPress }: EmojiButtonProps) => {
  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress(e, index);
    },
    [index, onPress]
  );

  return (
    <Pressable style={getButtonStyle} onPress={handlePress}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Pressable>
  );
});

EmojiButton.displayName = "EmojiButton";

// --- Main screen ---

export default function App() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config } = useBurstConfigStore();
  const burstRef = useRef<EmojiBurstRef>(null);

  const handleOpenSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleEmojiPress = useCallback(
    (e: GestureResponderEvent, index: number) => {
      const { pageX, pageY } = e.nativeEvent;
      burstRef.current?.burst({
        origin: { point: { x: pageX, y: pageY } },
        count: config.particlesPerBurst,
        emojiIndex: index,
      });
    },
    [config.particlesPerBurst]
  );

  const handleScreenPress = useCallback(() => {
    burstRef.current?.burst({
      origin: {
        region: {
          x: config.originXMin,
          y: config.originYMin,
          width: Math.max(1, config.originXMax - config.originXMin),
          height: Math.max(1, config.originYMax - config.originYMin),
        },
      },
      count: config.particlesPerBurst,
    });
  }, [config]);

  const emojiButtons = useMemo(
    () =>
      EMOJIS.map((emoji, index) => (
        <EmojiButton
          key={emoji}
          emoji={emoji}
          index={index}
          onPress={handleEmojiPress}
        />
      )),
    [handleEmojiPress]
  );

  // Memoize tuple/object props to prevent EmojiBurst internal useMemo invalidation
  const initialVelocityY = useMemo(
    () => [config.initialVelocityYMin, config.initialVelocityYMax] as [number, number],
    [config.initialVelocityYMin, config.initialVelocityYMax]
  );

  const initialVelocityX = useMemo(
    () => [config.initialVelocityXMin, config.initialVelocityXMax] as [number, number],
    [config.initialVelocityXMin, config.initialVelocityXMax]
  );

  const scaleRange = useMemo(
    () => [config.scaleMin, config.scaleMax] as [number, number],
    [config.scaleMin, config.scaleMax]
  );

  const rotationSpeedRange = useMemo(
    () => [config.rotationSpeedMin, config.rotationSpeedMax] as [number, number],
    [config.rotationSpeedMin, config.rotationSpeedMax]
  );

  const burstOrigin = useMemo(
    () => ({
      region: {
        x: config.originXMin,
        y: config.originYMin,
        width: Math.max(1, config.originXMax - config.originXMin),
        height: Math.max(1, config.originYMax - config.originYMin),
      },
    }),
    [config.originXMin, config.originYMin, config.originXMax, config.originYMax]
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.gearButton, { top: insets.top + 12 }]}
        onPress={handleOpenSettings}
      >
        <Text style={styles.gearText}>⚙️</Text>
      </Pressable>

      <Pressable style={styles.tapArea} onPress={handleScreenPress}>
        <Text style={styles.title}>Emoji Burst</Text>
        <Text style={styles.subtitle}>Tap here for a burst</Text>
        <Text style={styles.hint}>or tap the emojis below</Text>
      </Pressable>

      <View style={[styles.emojiRow, { paddingBottom: Math.max(24, insets.bottom + 8) }]}>
        {emojiButtons}
      </View>

      <EmojiBurst
        ref={burstRef}
        emojis={EMOJIS}
        particlesPerBurst={config.particlesPerBurst}
        emojiSize={config.emojiSize}
        maxParticles={config.maxParticles}
        gravity={config.gravity}
        initialVelocityY={initialVelocityY}
        initialVelocityX={initialVelocityX}
        scaleRange={scaleRange}
        rotationSpeedRange={rotationSpeedRange}
        lifetime={config.lifetime}
        fadeOutAfter={config.fadeOutAfter}
        origin={burstOrigin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  gearButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  gearText: {
    fontSize: 22,
  },
  tapArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
  },
  hint: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 24,
    backgroundColor: "#1a1a1a",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiButtonPressed: {
    backgroundColor: "#3a3a3a",
    transform: [{ scale: 0.9 }],
  },
  emoji: {
    fontSize: 28,
  },
});
