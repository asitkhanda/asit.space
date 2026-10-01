export type DayPhase = "day" | "afternoon" | "evening" | "night";

export const DAY_PHASES: DayPhase[] = [
  "day",
  "afternoon",
  "evening",
  "night",
];

export type PhaseLook = {
  id: DayPhase;
  label: string;
  sky: string;
  ambient: string;
  sun: string;
  sunIntensity: number;
  ambientIntensity: number;
  sunAngle: number;
  sunElevation: number;
  accent: string;
};

/** Warm paper spotlight — kept constant across phases. */
const SPOTLIGHT = "#f2ebe3";

export const PHASE_LOOK: Record<DayPhase, PhaseLook> = {
  day: {
    id: "day",
    label: "Day",
    sky: "#e8e8ea",
    ambient: "#ffffff",
    sun: "#f5f5f7",
    sunIntensity: 1.35,
    ambientIntensity: 0.72,
    sunAngle: 0.55,
    sunElevation: 0.85,
    accent: SPOTLIGHT,
  },
  afternoon: {
    id: "afternoon",
    label: "Afternoon",
    sky: "#d8d8dc",
    ambient: "#ececee",
    sun: "#e8e8ea",
    sunIntensity: 1.15,
    ambientIntensity: 0.55,
    sunAngle: 1.1,
    sunElevation: 0.45,
    accent: SPOTLIGHT,
  },
  evening: {
    id: "evening",
    label: "Evening",
    sky: "#2e2e34",
    ambient: "#6a6a72",
    sun: "#a0a0a8",
    sunIntensity: 0.55,
    ambientIntensity: 0.35,
    sunAngle: 1.7,
    sunElevation: 0.18,
    accent: SPOTLIGHT,
  },
  night: {
    id: "night",
    label: "Night",
    sky: "#121216",
    ambient: "#4a4a52",
    sun: "#8a8a92",
    sunIntensity: 0.18,
    ambientIntensity: 0.22,
    sunAngle: 2.4,
    sunElevation: 0.55,
    accent: SPOTLIGHT,
  },
};

export function phaseIndexForProgress(progress: number) {
  const clamped = Math.max(0, progress);
  return Math.floor(clamped) % DAY_PHASES.length;
}

export function phaseLookForProgress(progress: number): PhaseLook {
  const safe = Math.max(0, progress);
  const baseIndex = Math.floor(safe) % DAY_PHASES.length;
  const nextIndex = (baseIndex + 1) % DAY_PHASES.length;
  const blend = safe - Math.floor(safe);
  const from = PHASE_LOOK[DAY_PHASES[baseIndex]];
  const to = PHASE_LOOK[DAY_PHASES[nextIndex]];
  const mix = (a: number, b: number) => a + (b - a) * blend;
  const mixColor = (a: string, b: string) => {
    const fromColor = parseHex(a);
    const toColor = parseHex(b);
    const channel = (index: number) => Math.round(mix(fromColor[index], toColor[index]));
    return `#${[channel(0), channel(1), channel(2)]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")}`;
  };

  return {
    id: blend < 0.5 ? from.id : to.id,
    label: blend < 0.5 ? from.label : to.label,
    sky: mixColor(from.sky, to.sky),
    ambient: mixColor(from.ambient, to.ambient),
    sun: mixColor(from.sun, to.sun),
    sunIntensity: mix(from.sunIntensity, to.sunIntensity),
    ambientIntensity: mix(from.ambientIntensity, to.ambientIntensity),
    sunAngle: mix(from.sunAngle, to.sunAngle),
    sunElevation: mix(from.sunElevation, to.sunElevation),
    // Spotlight shade stays fixed — do not blend toward a second hue.
    accent: SPOTLIGHT,
  };
}

function parseHex(hex: string) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
}
