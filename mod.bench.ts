import * as oson from "./oson.ts";

const HUGE = [..."012345".repeat(10000)].map(parseFloat).map((n) => n << 5);
const SPARSE = Array(HUGE.length);
SPARSE[0] = "zero";
SPARSE[100] = "one";
SPARSE[SPARSE.length - 10] = "two";

function bench(group: string, value: unknown) {
  const str = JSON.stringify(value);
  const ls = oson.listify(value);
  const strO = oson.stringify(value);
  Deno.bench("JSON.stringify for " + group, () => {
    JSON.stringify(value);
  });
  Deno.bench("oson.stringify for " + group, () => {
    oson.stringify(value);
  });
  Deno.bench("oson.listify for " + group, () => {
    oson.listify(value);
  });
  Deno.bench("JSON.parse for " + group, () => {
    JSON.parse(str);
  });
  Deno.bench("oson.parse for " + group, () => {
    oson.parse(strO);
  });
  Deno.bench("oson.delistify for " + group, () => {
    oson.delistify(ls);
  });
}

bench("numbers", -1.3);
bench("strings", 'abc"def');
bench("long strings", 'abc"def'.repeat(10000));
bench("booleans", true);
bench("null", null);
bench("arrays", ["a", "b", 3, false, "e"]);
bench("large arrays", HUGE);
bench("sparse arrays", SPARSE);
bench("objects", { a: "x", b: 1, c: false });
bench("nested objects", { a: 0, b: 1, c: [{ x: "a", y: ["b"] }] });
const obj0 = { a: 0, b: 1, c: [{ x: "a", y: ["b"] }] };
const obj1 = [obj0, obj0, obj0];
bench("nested objects with repeated references", [obj1, obj1, obj1]);
