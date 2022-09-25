export const UNDEFINED_INDEX = -1 as const;
export const ARRAY_HOLE_INDEX = -2 as const;
export const NAN_INDEX = -3 as const;
export const POS_INF_INDEX = -4 as const;
export const NEG_INF_INDEX = -5 as const;

export type OsonMagic =
  | typeof UNDEFINED_INDEX
  | typeof ARRAY_HOLE_INDEX
  | typeof NAN_INDEX
  | typeof POS_INF_INDEX
  | typeof NEG_INF_INDEX;

export function toMagicNumber(value: unknown): OsonMagic | null {
  if (value === undefined) return UNDEFINED_INDEX;
  if (typeof value === "number") {
    if (isNaN(value)) return NAN_INDEX;
    if (!isFinite(value)) return value < 0 ? NEG_INF_INDEX : POS_INF_INDEX;
  }
  return null;
}
export function fromMagicNumber(value: number): undefined | number | null {
  switch (value) {
    case UNDEFINED_INDEX:
      return undefined;
    case NAN_INDEX:
      return NaN;
    case NEG_INF_INDEX:
      return -Infinity;
    case POS_INF_INDEX:
      return Infinity;
    default:
      return null;
  }
}
