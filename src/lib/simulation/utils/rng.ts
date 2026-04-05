export function mulberry32(seed: number) {
  let internal = seed;

  return () => {
    internal |= 0;
    internal = (internal + 0x6d2b79f5) | 0;
    let mixed = Math.imul(internal ^ (internal >>> 15), 1 | internal);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomFrom<T>(rng: () => number, values: T[]): T {
  return values[Math.floor(rng() * values.length)] ?? values[0];
}

export function randomBetween(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}
