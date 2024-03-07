// deno-lint-ignore-file no-explicit-any
// magic numbers for values
/** internal magic number representing undefined */
export const UNDEFINED_INDEX = -1 as const;
/** internal magic number representing an array hole */
export const ARRAY_HOLE_INDEX = -2 as const;
/** internal magic number representing NaN */
export const NAN_INDEX = -3 as const;
/** internal magic number representing Infinity */
export const POS_INF_INDEX = -4 as const;
/** internal magic number representing -Infinity */
export const NEG_INF_INDEX = -5 as const;

// magic numbers for oson list type labels
/** internal magic number labelling a bigint */
export const BIG_INT_LABEL = -6 as const;

/** union type of all internal magic numbers */
export type OsonMagic =
  | typeof UNDEFINED_INDEX
  | typeof ARRAY_HOLE_INDEX
  | typeof NAN_INDEX
  | typeof POS_INF_INDEX
  | typeof NEG_INF_INDEX;

/** encoded Oson data */
export type Oson = OsonMagic | OsonValue[];
/** value inside encoded Oson data */
export type OsonValue = OsonPrimitive | OsonList;
/** primitive value inside encoded Oson data */
export type OsonPrimitive = string | number | boolean | null;
/** complex value inside encoded Oson data */
export type OsonList = OsonBigInt | OsonArray | OsonObject;
/** bigint encoded as Oson data */
export type OsonBigInt = [typeof BIG_INT_LABEL, string];
/** array encoded as Oson data */
export type OsonArray = number[];
/** object encoded as Oson data */
export type OsonObject = [label: string, ...values: number[]];

function isOsonObject(array: OsonList): array is OsonObject {
  return typeof array[0] === "string";
}
function isOsonBigInt(array: OsonList): array is OsonBigInt {
  return array[0] === BIG_INT_LABEL;
}

export * from "./constructors.ts";
import {
  type ConstructorMap,
  GLOBAL_CONSTRUCTOR_MAP,
  PLAIN_OBJECT_LABEL,
} from "./constructors.ts";

/**
 * Converts a value to string. This will preserve circular and repeated
 * references as well as undefined, sparse arrays, bigint, and all classes
 * instances defined by the constructor map.
 *
 * @param value The value to convert to string
 * @param constructors The constructor map to use for class instances
 * @returns The string containing the encoded value
 */
export function stringify<C = any>(
  value: unknown = undefined,
  constructors: ConstructorMap<C> = GLOBAL_CONSTRUCTOR_MAP,
): string {
  return JSON.stringify(listify(value, constructors));
}

/**
 * Converts a string created using `stringify` back to a value. This will
 * restore circular and repeated references as well as undefined, sparse arrays,
 * bigint, and all classes instances defined by the constructor map.
 *
 * @param text The string containing the encoded value
 * @param constructors The constructor map to use for class instances
 * @returns The parsed value
 */
export function parse<C = any>(
  text: string,
  constructors: ConstructorMap<C> = GLOBAL_CONSTRUCTOR_MAP,
): any {
  return delistify(JSON.parse(text), constructors);
}

function toMagicNumber(value: unknown): OsonMagic | null {
  if (value === undefined) return UNDEFINED_INDEX;
  if (typeof value === "number") {
    if (isNaN(value)) return NAN_INDEX;
    if (!isFinite(value)) return value < 0 ? NEG_INF_INDEX : POS_INF_INDEX;
  }
  return null;
}
function fromMagicNumber(value: number): undefined | number | null {
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

const SPARSE_PROTO: number[] = [];
function sparse(len: number) {
  if (SPARSE_PROTO.length < len) {
    const old = SPARSE_PROTO.length;
    SPARSE_PROTO.length = len;
    SPARSE_PROTO.fill(ARRAY_HOLE_INDEX, old, len);
  }
  return SPARSE_PROTO.slice(0, len);
}

function fromObject(
  value: object,
  constructors: ConstructorMap,
): [string, unknown[]] {
  // check if we have this instance registered
  const constr = value.constructor;
  if (typeof constr === "function") {
    const label = constr.name;
    const inst = constructors.get(label);
    if (inst !== undefined) {
      return [label, inst.from(value)];
    }
  }
  // no instance found, fall back to normal object
  const entries = Object.entries(value);
  const cnt = entries.length;
  const val: unknown[] = Array(cnt + cnt);
  for (let i = 0; i < cnt; i++) {
    const entry = entries[i];
    const ii = i + i;
    val[ii] = entry[0];
    val[ii + 1] = entry[1];
  }
  return [PLAIN_OBJECT_LABEL, val];
}
function stubObject(label: string, constructors: ConstructorMap) {
  // stub a plain object
  if (label === PLAIN_OBJECT_LABEL) return {};
  // stub an instance
  const stub = constructors.get(label);
  if (stub === undefined) {
    throw new Error(`Unknown stub type: ${label}`);
  }
  if ("stub" in stub) return stub.stub();
  else return undefined;
}
function hydrateObject(
  label: string,
  stub: object,
  val: any,
  constructors: ConstructorMap,
) {
  if (label === PLAIN_OBJECT_LABEL) {
    const object = stub as Record<string, any>;
    for (let i = 0; i < val.length; i += 2) {
      object[val[i]] = val[i + 1];
    }
    return object;
  }
  const hydrator = constructors.get(label);
  if (hydrator === undefined) {
    throw new Error(`Unknown object type: ${label}`);
  }
  if (!("hydrate" in hydrator)) {
    throw new Error(`Do not know how to hydrate stub type: ${label}`);
  }
  hydrator.hydrate(stub, val);
}
function createObject(label: string, val: any, constructors: ConstructorMap) {
  const creator = constructors.get(label);
  if (creator === undefined) {
    throw new Error(`Unknown object type: ${label}`);
  }
  if (!("create" in creator)) {
    throw new Error(`Do not know how to create object type: ${label}`);
  }
  return creator.create(val);
}

/**
 * Converts a value to Oson data. Oson data only contains numbers, strings,
 * arrays, and null values, and can therefore be JSON-encoded. This will
 * preserve circular and repeated references as well as undefined, sparse
 * arrays, bigint, and all classes instances defined by the constructor map.
 *
 * @param value The value to convert to Oson data
 * @param constructors The constructor map to use for class instances
 * @returns The Oson data containing the encoded value
 */
export function listify<C = any>(
  value: unknown,
  constructors: ConstructorMap<C> = GLOBAL_CONSTRUCTOR_MAP,
): Oson {
  const num = toMagicNumber(value);
  if (num !== null) return num;

  const list: OsonValue[] = [];
  const index = new Map<unknown, number>();

  add(value);

  return list;

  function add(value: unknown): number {
    const num = toMagicNumber(value);
    if (num !== null) return num;
    let position = index.get(value);
    if (position !== undefined) return position;
    position = list.length;
    switch (typeof value) {
      case "number":
      case "string":
      case "boolean":
        list[position] = value;
        index.set(value, position);
        break;
      case "bigint": {
        list[position] = [BIG_INT_LABEL, value.toString(16)];
        index.set(value, position);
        break;
      }
      case "object":
        if (value === null) {
          list[position] = value;
          index.set(value, position);
        } else if (Array.isArray(value)) {
          const arr: OsonArray = sparse(value.length);
          list[position] = arr;
          index.set(value, position);
          for (const i in value) {
            arr[i] = add(value[i]);
          }
        } else {
          const [label, vals] = fromObject(value, constructors);
          const len = vals.length;
          const arr = Array(len + 1) as OsonObject;
          arr[0] = label;
          list[position] = arr;
          index.set(value, position);
          for (let i = 0; i < len; i++) {
            arr[i + 1] = add(vals[i]);
          }
        }
    }
    return position;
  }
}

/**
 * Converts a Oson data back to a value. This will restore circular and repeated
 * references as well as undefined, sparse arrays, bigint, and all classes
 * instances defined by the constructor map.
 *
 * @param oson The Oson data to convert
 * @param constructors The constructor map to use for class instances
 * @returns The decoded value
 */
export function delistify<C = any>(
  oson: Oson,
  constructors: ConstructorMap<C> = GLOBAL_CONSTRUCTOR_MAP,
): any {
  if (!Array.isArray(oson)) {
    const val = fromMagicNumber(oson);
    if (val !== null) return val;
    else throw new Error(`Invalid Oson: ${oson}`);
  }
  if (oson.length === 0) throw new Error("Empty Oson data!");
  const list = oson;
  const index = Array(oson.length);
  recover(0);
  return index[0];

  function recover(position: number) {
    const val = fromMagicNumber(position);
    if (val !== null) return val;

    if (!(position in index)) {
      const value = list[position];
      switch (typeof value) {
        case "object":
          if (value !== null) {
            if (isOsonBigInt(value)) {
              const val = value[1];
              const num = val.startsWith("-")
                ? -BigInt("0x" + val.substring(1))
                : BigInt("0x" + val);
              index[position] = num;
            } else if (isOsonObject(value)) {
              const [label, ...vals] = value;
              const stub = stubObject(label, constructors);
              if (stub === undefined) {
                const v = vals.map(recover);
                const o = createObject(label, v, constructors);
                index[position] = o;
              } else {
                index[position] = stub;
                const v = vals.map(recover);
                hydrateObject(label, stub, v, constructors);
              }
            } else {
              const len = value.length;
              const array = Array(len);
              index[position] = array;
              for (let i = 0; i < len; i++) {
                const val = value[i];
                if (val !== ARRAY_HOLE_INDEX) {
                  array[i] = recover(val);
                }
              }
            }
            break;
          }
        // fallthrough for null
        case "string":
        case "boolean":
        case "number":
          index[position] = value;
          break;
      }
    }
    return index[position];
  }
}
