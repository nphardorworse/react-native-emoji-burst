export function randomRange(min: number, max: number): number {
  "worklet";
  return min + Math.random() * (max - min);
}

/** Returns a random integer in [min, max) — max is exclusive. */
export function randomInt(min: number, max: number): number {
  "worklet";
  return Math.min(Math.floor(min + Math.random() * (max - min)), max - 1);
}
