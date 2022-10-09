import { parse, stringify } from "./oson.ts";

const HUGE = [..."012345".repeat(10000)].map(parseFloat).map((n) => n << 5);
const SPARSE = Array(HUGE.length);
SPARSE[0] = "zero";
SPARSE[100] = "one";
SPARSE[SPARSE.length - 10] = "two";

Deno.bench(
  "JSON.stringify numbers",
  { group: "serialize numbers", baseline: true },
  () => {
    JSON.stringify(-1.3);
  },
);
Deno.bench("stringify numbers", {
  group: "serialize numbers",
}, () => {
  stringify(-1.3);
});

Deno.bench(
  "JSON.stringify strings",
  { group: "serialize strings", baseline: true },
  () => {
    JSON.stringify('abc"def');
  },
);
Deno.bench("stringify strings", {
  group: "serialize strings",
}, () => {
  stringify('abc"def');
});

Deno.bench("JSON.stringify long strings", {
  group: "serialize long strings",
  baseline: true,
}, () => {
  JSON.stringify('abc"def'.repeat(10000));
});
Deno.bench("stringify long strings", {
  group: "serialize long strings",
}, () => {
  stringify('abc"def'.repeat(10000));
});

Deno.bench(
  "JSON.stringify booleans",
  { group: "serialize booleans", baseline: true },
  () => {
    JSON.stringify(true);
  },
);
Deno.bench("stringify booleans", {
  group: "serialize booleans",
}, () => {
  stringify(true);
});

Deno.bench("JSON.stringify null", {
  group: "serialize null",
  baseline: true,
}, () => {
  JSON.stringify(null);
});
Deno.bench("stringify null", {
  group: "serialize null",
}, () => {
  stringify(null);
});

Deno.bench("JSON.stringify arrays", {
  group: "serialize arrays",
  baseline: true,
}, () => {
  JSON.stringify(["a", "b", "c", 4, false]);
});
Deno.bench("stringify arrays", {
  group: "serialize arrays",
}, () => {
  stringify(["a", "b", "c", 4, false]);
});

Deno.bench("JSON.stringify large arrays", {
  group: "serialize large arrays",
  baseline: true,
}, () => {
  JSON.stringify(HUGE);
});
Deno.bench("stringify large arrays", {
  group: "serialize large arrays",
}, () => {
  stringify(HUGE);
});

Deno.bench("JSON.stringify sparse arrays", {
  group: "serialize sparse arrays",
  baseline: true,
}, () => {
  JSON.stringify(SPARSE);
});
Deno.bench("stringify sparse arrays", {
  group: "serialize sparse arrays",
}, () => {
  stringify(SPARSE);
});

Deno.bench(
  "JSON.stringify objects",
  { group: "serialize objects", baseline: true },
  () => {
    JSON.stringify({ a: "x", b: 1, c: false });
  },
);
Deno.bench("stringify objects", {
  group: "serialize objects",
}, () => {
  stringify({ a: "x", b: 1, c: false });
});

Deno.bench("JSON.stringify nested objects", {
  group: "serialize nested objects",
  baseline: true,
}, () => {
  JSON.stringify({ a: 0, b: 1, c: [{ x: "a", y: ["b"] }] });
});
Deno.bench("stringify nested objects", {
  group: "serialize nested objects",
}, () => {
  stringify({ a: 0, b: 1, c: [{ x: "a", y: ["b"] }] });
});

Deno.bench("JSON.stringify nested objects with repeated references", {
  group: "serialize nested objects repeated",
  baseline: true,
}, () => {
  const obj0 = { a: 0, b: 1, c: [{ x: "a", y: ["b"] }] };
  const obj1 = [obj0, obj0, obj0];
  JSON.stringify([obj1, obj1, obj1]);
});
Deno.bench("stringify nested objects with repeated references", {
  group: "serialize nested objects repeated",
}, () => {
  const obj0 = { a: 0, b: 1, c: [{ x: "a", y: ["b"] }] };
  const obj1 = [obj0, obj0, obj0];
  stringify([obj1, obj1, obj1]);
});

//// PARSE

const num = JSON.stringify(-1.3);
const numO = stringify(-1.3);
Deno.bench(
  "JSON.parse numbers",
  { group: "deserialize numbers", baseline: true },
  () => {
    JSON.parse(num);
  },
);
Deno.bench("parse numbers", {
  group: "deserialize numbers",
}, () => {
  parse(numO);
});

const str = JSON.stringify('abc"def');
const strO = stringify('abc"def');
Deno.bench(
  "JSON.parse strings",
  { group: "deserialize strings", baseline: true },
  () => {
    JSON.parse(str);
  },
);
Deno.bench("parse strings", {
  group: "deserialize strings",
}, () => {
  parse(strO);
});

const lstr = JSON.stringify('abc"def'.repeat(10000));
const lstrO = stringify('abc"def'.repeat(10000));
Deno.bench("JSON.parse long strings", {
  group: "deserialize long strings",
  baseline: true,
}, () => {
  JSON.parse(lstr);
});
Deno.bench("parse long strings", {
  group: "deserialize long strings",
}, () => {
  parse(lstrO);
});

const bool = JSON.stringify(true);
const boolO = stringify(true);
Deno.bench(
  "JSON.parse booleans",
  { group: "deserialize booleans", baseline: true },
  () => {
    JSON.parse(bool);
  },
);
Deno.bench("parse booleans", {
  group: "deserialize booleans",
}, () => {
  parse(boolO);
});

const nil = JSON.stringify(null);
const nilO = stringify(null);
Deno.bench("JSON.parse null", {
  group: "deserialize null",
  baseline: true,
}, () => {
  JSON.parse(nil);
});
Deno.bench("parse null", {
  group: "deserialize null",
}, () => {
  parse(nilO);
});

const arr = JSON.stringify(["a", "b", "c", 4, false]);
const arrO = stringify(["a", "b", "c", 4, false]);
Deno.bench("JSON.parse arrays", {
  group: "deserialize arrays",
  baseline: true,
}, () => {
  JSON.parse(arr);
});
Deno.bench("parse arrays", {
  group: "deserialize arrays",
}, () => {
  parse(arrO);
});

const larr = JSON.stringify(HUGE);
const larrO = stringify(HUGE);
Deno.bench("JSON.parse large arrays", {
  group: "parse large arrays",
  baseline: true,
}, () => {
  JSON.parse(larr);
});
Deno.bench("parse large arrays", {
  group: "parse large arrays",
}, () => {
  parse(larrO);
});

const sarr = JSON.stringify(SPARSE);
const sarrO = stringify(SPARSE);
Deno.bench("JSON.parse sparse arrays", {
  group: "deserialize sparse arrays",
  baseline: true,
}, () => {
  JSON.parse(sarr);
});
Deno.bench("parse sparse arrays", {
  group: "deserialize sparse arrays",
}, () => {
  parse(sarrO);
});

const obj = JSON.stringify({ a: "x", b: 1, c: false });
const objO = stringify({ a: "x", b: 1, c: false });
Deno.bench(
  "JSON.parse objects",
  { group: "deserialize objects", baseline: true },
  () => {
    JSON.parse(obj);
  },
);
Deno.bench("parse objects", {
  group: "deserialize objects",
}, () => {
  parse(objO);
});

const nobj = JSON.stringify({ a: 0, b: 1, c: [{ x: "a", y: ["b"] }] });
const nobjO = stringify({ a: 0, b: 1, c: [{ x: "a", y: ["b"] }] });
Deno.bench("JSON.parse nested objects", {
  group: "deserialize nested objects",
  baseline: true,
}, () => {
  JSON.parse(nobj);
});
Deno.bench("parse nested objects", {
  group: "deserialize nested objects",
}, () => {
  parse(nobjO);
});

const obj0 = { a: 0, b: 1, c: [{ x: "a", y: ["b"] }] };
const obj1 = [obj0, obj0, obj0];
const robj = JSON.stringify([obj1, obj1, obj1]);
const robjO = stringify([obj1, obj1, obj1]);
Deno.bench("JSON.parse nested objects with repeated references", {
  group: "deserialize nested objects repeated",
  baseline: true,
}, () => {
  JSON.parse(robj);
});
Deno.bench("parse nested objects with repeated references", {
  group: "deserialize nested objects repeated",
}, () => {
  parse(robjO);
});
