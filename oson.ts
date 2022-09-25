// deno-lint-ignore-file ban-types no-explicit-any
import {
  ARRAY_HOLE_INDEX,
  fromMagicNumber,
  type OsonMagic,
  toMagicNumber,
} from "./magic.ts";

// export type ConstructorMap<C = any> = Map<
//   new () => C,
//   SerializableConstructor<C>
// >;
// export interface SerializableConstructor<C, V = any[]> {
//   deconstruct: (instance: C) => V;
//   reconstruct: (val: V) => C;
// }

export type Oson = OsonMagic | OsonValue[];
type OsonValue = OsonPrimitive | OsonArray | OsonObject;
type OsonPrimitive = string | number | boolean | null;
type OsonArray = number[];
type OsonObject = [label: string, ...values: number[]];

export function stringify(value: unknown = undefined): string {
  return JSON.stringify(listify(value));
}

export function listify(value: unknown): Oson {
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
      case "object":
        if (value === null) {
          list[position] = value;
          index.set(value, position);
        } else if (Array.isArray(value)) {
          const arr: OsonArray = [];
          list[position] = arr;
          index.set(value, position);
          for (let i = 0; i < value.length; i++) {
            arr.push(i in value ? add(value[i]) : ARRAY_HOLE_INDEX);
          }
        } else {
          const [label, vals] = fromObject(value);
          const arr: OsonObject = [label];
          list[position] = arr;
          index.set(value, position);
          for (const val of vals) arr.push(add(val));
        }
    }
    return position;
  }
}

function isOsonArray(array: OsonArray | OsonObject): array is OsonArray {
  return typeof array[0] !== "string";
}
function fromObject(value: object): [string, unknown[]] {
  const val: unknown[] = [];
  for (const [k, v] of Object.entries(value)) val.push(k, v);
  return ["o", val];
}
function stubObject(label: string) {
  switch (label) {
    case "o":
      return {};
    default:
      throw new Error(`Unknown stub type: ${label}`);
  }
}
function hydrateObject(label: string, value: object, vals: any[]) {
  switch (label) {
    case "o": {
      const object = value as Record<string, any>;
      for (let i = 0; i < vals.length; i += 2) object[vals[i]] = vals[i + 1];
      break;
    }
    default:
      throw new Error(`Unknown object type: ${label}`);
  }
}

export function parse(text: string): any {
  return delistify(JSON.parse(text));
}

export function delistify(oson: Oson): any {
  if (!Array.isArray(oson)) {
    const val = fromMagicNumber(oson);
    if (val !== null) return val;
    else throw new Error(`Invalid Oson: ${oson}`);
  }
  if (oson.length === 0) throw new Error("Empty Oson data!");
  const list = oson;
  const index: any[] = [];
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
            if (isOsonArray(value)) {
              const array: any[] = [];
              index[position] = array;
              for (const i of value) {
                if (i === ARRAY_HOLE_INDEX) array.length++;
                else array.push(recover(i));
              }
            } else {
              const [label, ...vals] = value;
              const object = stubObject(label);
              index[position] = object;
              hydrateObject(label, object, vals.map(recover));
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
