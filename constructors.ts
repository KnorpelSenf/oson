// deno-lint-ignore-file no-explicit-any no-explicit-any
/** a map with class names as keys and the respective serializers as values */
export type ConstructorMap<C = any> = Map<string, SerializableConstructor<C>>;
/** a serializer for values or buckets */
export type SerializableConstructor<C, V = any> =
  | ValueConstructor<C, V>
  | BucketContructor<C, V>;
/** common properties of all serializers */
export interface DecomposableConstructor<C, V = any> {
  /** class constructor */
  instance: new () => C;
  /** converts an instance to a value array */
  from(instance: C): V[];
}
/** a serializer for a value that does not contain nested values */
export interface ValueConstructor<C, V = any>
  extends DecomposableConstructor<C, V> {
  /** creates a class from a value array */
  create(val: V[]): C;
}

export interface BucketContructor<C, V = any>
  extends DecomposableConstructor<C, V> {
  /** stubs a class instance that can be re-hydrated */
  stub: () => C;
  /** re-hydrates a class instance with its nested values */
  hydrate: (stub: C, val: V[]) => void;
}

/** label for plain JS object types */
export const PLAIN_OBJECT_LABEL = "";
/**
 * Globally available constructor map that holds sensible default serializers
 * for the following values:
 * - Error
 * - Uint8Array
 * - Map
 * - Set
 * - Date
 * - RegExp
 * - URL
 *
 * You can modify this if you want, but remember that it is global state.
 *
 * This map will be used as the default value for all calls to `parse`,
 * `stringify`, `listify`, and `delistify` if you do not specify your own
 * constructor map explictily.
 */
export const GLOBAL_CONSTRUCTOR_MAP: ConstructorMap = globalConstructorMap();

const enc = new TextEncoder();
const dec8 = new TextDecoder("utf-8");
/** creates a new global constructor map as found in GLOBAL_CONSTRUCTOR_MAP */
export function globalConstructorMap(): ConstructorMap {
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
