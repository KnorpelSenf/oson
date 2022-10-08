// deno-lint-ignore-file no-explicit-any no-explicit-any
export type ConstructorMap<C = any> = Map<string, SerializableConstructor<C>>;
export type SerializableConstructor<C, V = any> =
  | ValueConstructor<C, V>
  | BucketContructor<C, V>;
export interface DecomposableConstructor<C, V = any> {
  instance: new () => C;
  from: (instance: C) => V;
}
export interface ValueConstructor<C, V = any>
  extends DecomposableConstructor<C, V> {
  create: (val: V) => void;
}
export interface BucketContructor<C, V = any>
  extends DecomposableConstructor<C, V> {
  stub: () => C;
  hydrate: (stub: C, val: V) => void;
}

export const PLAIN_OBJECT_LABEL = "";
export const GLOBAL_CONSTRUCTOR_MAP = globalConstructorMap();

const enc = new TextEncoder();
const dec = new TextDecoder();
export function globalConstructorMap() {
  const error: BucketContructor<Error> = {
    instance: Error,
    from: (err) => [err.name, err.message, err.stack, err.cause],
    stub: () => new Error(),
    hydrate: (err, [name, message, stack, cause]) =>
      Object.assign(err, { name, message, stack, cause }),
  };
  const uint8Array: ValueConstructor<Uint8Array, string> = {
    instance: Uint8Array,
    from: (arr) => btoa(dec.decode(arr)),
    create: (data) => enc.encode(atob(data)),
  };
  const uint16Array: ValueConstructor<Uint16Array, string> = {
    instance: Uint16Array,
    from: (arr) => btoa(dec.decode(arr)),
    create: (data) => enc.encode(atob(data)),
  };
  const map: BucketContructor<Map<any, any>, Array<[any, any]>> = {
    instance: Map,
    from: (m) => [...m.entries()],
    stub: () => new Map(),
    hydrate: (m, entries) => entries.forEach(([k, v]) => m.set(k, v)),
  };
  const set: BucketContructor<Set<any>, any[]> = {
    instance: Set,
    from: (s) => [...s.values()],
    stub: () => new Set(),
    hydrate: (s, values) => values.forEach((v) => s.add(v)),
  };
  const date: ValueConstructor<Date, string> = {
    instance: Date,
    from: (d) => d.toJSON(),
    create: (json) => new Date(json),
  };
  const regex: ValueConstructor<RegExp, [string, string?]> = {
    instance: RegExp as unknown as new () => RegExp,
    from: ({ source, flags }) => flags ? [source, flags] : [source],
    create: ([source, flags]) => new RegExp(source, flags),
  };

  const res: ConstructorMap = new Map();
  const constructors = [error, uint8Array, uint16Array, map, set, date, regex];
  for (const c of constructors) res.set(c.instance.name, c);
  return res;
}
