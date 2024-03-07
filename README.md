# oson structured object notation

> THIS LIBRARY HAS MOVED TO JSR.
> PLEASE IMPORT IT FROM [HERE](https://jsr.io/@knorpelsenf/oson) FROM NOW ON.

json has a bunch of problems.

oson fixes them.

## installation

```ts
// deno:
import * as oson from "https://deno.land/x/oson/mod.ts";
// node:
import * as oson from "o-son"; // npm install o-son
```

## features

oson can encode **circular references**:

```js
const obj = {};
obj.self = obj;
JSON.stringify(obj); // error
oson.stringify(obj); // works!
```

oson can encode **repeated references**:

```js
const obj = {};
const arr = [obj, obj];
const [left, right] = JSON.parse(JSON.stringify(arr));
assertStrictEquals(left, right); // error
const [l, r] = oson.parse(oson.stringify(arr));
assertStrictEquals(l, r); // works!
```

oson can encode **undefined**:

```js
const undef = oson.parse(oson.stringify(undefined));
assertStrictEquals(undef, undefined);
```

oson can encode **sparse arrays**:

```js
const arr = [5, , , , 6, , , 7];
console.log(oson.parse(oson.stringify(arr)));
// [ 5, <3 empty items>, 6, <2 empty items>, 7 ]
```

oson can encode **bigint**:

```js
const num = 10n ** 1000n;
JSON.stringify(num); // error
oson.stringify(num); // works!
```

oson can encode **class instances** of the following built-in types:

- `Map`
- `Set`
- `Date`
- `RegExp`
- `Error`
- `Uint8Array`
- `URL`

oson can encode **class instances** of your custom classes:

```ts
class A {
  constructor(public prop: string) {}
}
const serializer: ValueConstructor<A, string> = {
  instance: A,
  from: (a) => [a.prop],
  create: ([prop]) => new A(prop),
};

GLOBAL_CONSTRUCTOR_MAP.set(A.name, serializer);

const a = new A("str");

assertInstanceOf(JSON.parse(JSON.stringify(a)), A); // error
assertInstanceOf(oson.parse(oson.stringify(a)), A); // works!
```

see also [this type definition](https://deno.land/x/oson/mod.ts?s=BucketContructor) for classes that are containers for object values (which may lead to circular references).

oson provides `listify` and `delistify` which can be used to convert objects to a representation that `JSON` accepts.

```ts
const num = 10n;
JSON.stringify(num); // error
JSON.stringify(oson.listify(num)); // works!
```

this lets you avoid repeated serialization.

## non-goals

the following things are explicitly not supported.

and they never will be, because they can never work well.

- symbols (would not preserve equality)
- functions (would not behave identically)
- modules (ditto)

## name

the _oson_ in the name stands for _oson structured object notation_.

---

written from scratch, based on ideas in [ARSON](https://github.com/benjamn/arson).
