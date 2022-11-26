// deno-lint-ignore-file no-explicit-any no-explicit-any
export type ConstructorMap<C = any> = Map<string, SerializableConstructor<C>>;
export type SerializableConstructor<C, V = any> =
  | ValueConstructor<C, V>
  | BucketContructor<C, V>;
export interface DecomposableConstructor<C, V = any> {
  instance: new () => C;
  from: (instance: C) => V[];
}
export interface ValueConstructor<C, V = any>
  extends DecomposableConstructor<C, V> {
  create: (val: V[]) => void;
}
export interface BucketContructor<C, V = any>
  extends DecomposableConstructor<C, V> {
  stub: () => C;
  hydrate: (stub: C, val: V[]) => void;
}

export const PLAIN_OBJECT_LABEL = "";
export const GLOBAL_CONSTRUCTOR_MAP = globalConstructorMap();

const enc = new TextEncoder();
const dec8 = new TextDecoder("utf-8");
export function globalConstructorMap() {
  const error: BucketContructor<Error> = {
    instance: Error,
    from: (err) => {
      const res: unknown[] = [err.name, err.message];
      if (err.stack !== undefined) res.push(err.stack);
      if (err.cause !== undefined) {
        if (err.stack === undefined) res.push(undefined);
        res.push(err.cause);
      }
      return res;
    },
    stub: () => new Error(),
    hydrate: (err, [name, message, stack, cause]) => {
      err.name = name;
      err.message = message;
      if (stack === undefined) delete err.stack;
      else err.stack = stack;
      if (cause !== undefined) err.cause = cause;
    },
  };
  const uint8Array: ValueConstructor<Uint8Array, string> = {
    instance: Uint8Array,
    from: (arr) => [btoa(dec8.decode(arr))],
    create: ([data]) => enc.encode(atob(data)),
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
    from: (d) => [d.toJSON()],
    create: ([json]) => new Date(json),
  };
  const regex: ValueConstructor<RegExp, string> = {
    instance: RegExp as unknown as new () => RegExp,
    from: ({ source, flags }) => flags ? [source, flags] : [source],
    create: ([source, flags]) => new RegExp(source, flags),
  };
  const url: ValueConstructor<URL, string> = {
    instance: URL as unknown as new () => URL,
    from: (url) => [url.href],
    create: ([href]) => new URL(href),
  };

  const res: ConstructorMap = new Map();
  const constructors = [error, uint8Array, map, set, date, regex, url];
  for (const c of constructors) res.set(c.instance.name, c);
  return res;
}
