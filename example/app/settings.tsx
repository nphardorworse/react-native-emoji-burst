import { memo, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useBurstConfigStore,
} from "../hooks/useBurstConfigStore";
import type { BurstConfig } from "../hooks/useBurstConfig";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  field: keyof BurstConfig;
  onFieldChange: <K extends keyof BurstConfig>(key: K, value: BurstConfig[K]) => void;
}

const SliderRow = memo(({
  label,
  value,
  min,
  max,
  step = 1,
  field,
  onFieldChange,
}: SliderRowProps) => {
  const handleChange = useCallback(
    (v: number) => {
      onFieldChange(field, v);
    },
    [field, onFieldChange]
  );

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {step < 1 ? value.toFixed(1) : Math.round(value)}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={handleChange}
        minimumTrackTintColor="#f97316"
        maximumTrackTintColor="#333"
        thumbTintColor="#fff"
      />
    </View>
  );
});

SliderRow.displayName = "SliderRow";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config, updateField, resetToDefaults } = useBurstConfigStore();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.resetButton} onPress={resetToDefaults}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={handleBack}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(24, insets.bottom + 16) }]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Particles">
          <SliderRow
            label="Per burst"
            value={config.particlesPerBurst}
            min={1}
            max={50}
            field="particlesPerBurst"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Max on screen"
            value={config.maxParticles}
            min={10}
            max={500}
            step={10}
            field="maxParticles"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Emoji size"
            value={config.emojiSize}
            min={16}
            max={72}
            step={2}
            field="emojiSize"
            onFieldChange={updateField}
          />
        </Section>

        <Section title="Origin X range">
          <SliderRow
            label="Min X"
            value={config.originXMin}
            min={0}
            max={500}
            field="originXMin"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Max X"
            value={config.originXMax}
            min={0}
            max={500}
            field="originXMax"
            onFieldChange={updateField}
          />
        </Section>

        <Section title="Origin Y range">
          <SliderRow
            label="Min Y"
            value={config.originYMin}
            min={0}
            max={900}
            field="originYMin"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Max Y"
            value={config.originYMax}
            min={0}
            max={900}
            field="originYMax"
            onFieldChange={updateField}
          />
        </Section>

        <Section title="Physics">
          <SliderRow
            label="Gravity"
            value={config.gravity}
            min={0}
            max={2000}
            step={10}
            field="gravity"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Velocity Y min"
            value={config.initialVelocityYMin}
            min={0}
            max={1500}
            step={10}
            field="initialVelocityYMin"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Velocity Y max"
            value={config.initialVelocityYMax}
            min={0}
            max={1500}
            step={10}
            field="initialVelocityYMax"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Velocity X min"
            value={config.initialVelocityXMin}
            min={-600}
            max={600}
            step={10}
            field="initialVelocityXMin"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Velocity X max"
            value={config.initialVelocityXMax}
            min={-600}
            max={600}
            step={10}
            field="initialVelocityXMax"
            onFieldChange={updateField}
          />
        </Section>

        <Section title="Appearance">
          <SliderRow
            label="Scale min"
            value={config.scaleMin}
            min={0.1}
            max={3}
            step={0.1}
            field="scaleMin"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Scale max"
            value={config.scaleMax}
            min={0.1}
            max={3}
            step={0.1}
            field="scaleMax"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Rotation speed min"
            value={config.rotationSpeedMin}
            min={-10}
            max={10}
            step={0.5}
            field="rotationSpeedMin"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Rotation speed max"
            value={config.rotationSpeedMax}
            min={-10}
            max={10}
            step={0.5}
            field="rotationSpeedMax"
            onFieldChange={updateField}
          />
        </Section>

        <Section title="Timing">
          <SliderRow
            label="Lifetime (s)"
            value={config.lifetime}
            min={0.5}
            max={10}
            step={0.1}
            field="lifetime"
            onFieldChange={updateField}
          />
          <SliderRow
            label="Fade out after (s)"
            value={config.fadeOutAfter}
            min={0}
            max={config.lifetime}
            step={0.1}
            field="fadeOutAfter"
            onFieldChange={updateField}
          />
        </Section>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  resetButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
  },
  resetText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f97316",
  },
  closeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    color: "#ccc",
  },
  value: {
    fontSize: 15,
    color: "#f97316",
    fontVariant: ["tabular-nums"],
    minWidth: 40,
    textAlign: "right",
  },
  slider: {
    width: "100%",
    height: 32,
  },
});
