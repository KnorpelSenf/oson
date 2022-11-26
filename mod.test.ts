// deno-lint-ignore-file no-explicit-any
import { assertEquals } from "https://deno.land/std@0.166.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.166.0/testing/bdd.ts";
import fc from "npm:fast-check@3.3.0";

import { parse, stringify } from "./mod.ts";

function test<T>(value: T) {
  const processed = parse(stringify(value));
  assertEquals(processed, value);
}

describe("oson", () => {
  it("can work with numbers", () => {
    test(3);
    test(0);
    test(-1.3);
    test(NaN);
    test(Infinity);
    test(-Infinity);
  });
  it("can work with strings", () => {
    test("a");
    test("abc");
    test("");
  });
  it("can work with booleans", () => {
    test(true);
    test(false);
  });
  it("can work with nullish values", () => {
    test(undefined);
    test(void 0);
    test(null);
  });
  it("can work with bigints", () => {
    test(0n);
    test(-100n);
    test(523547235723763498657304658394876094765029746509275n);
    test(-(2n << 1024n));
  });
  it("can work with arrays", () => {
    test(["a", "b", "c"]);
    test([1, 2, 3]);
    test([]);
    test([-1]);
    test([0, ""]);
  });
  it("can work with sparse arrays", () => {
    test([]);
    test([, 1]);
    test([1, , 3]);
    test([1, , 3, , 4]);
  });
  it("can work with objects", () => {
    test({ a: 0 });
    test({ a: "b" });
    test({ a: 0, b: 1 });
    test({});
  });
  it("can work with nested objects", () => {
    test({ a: { b: 0 } });
    test({ a: ["", 0] });
    test({ a: 0, b: 1, c: [{ x: "a", y: ["b"] }] });
    test({ v: { w: {} } });
  });
  it("can work with built-in types", () => {
    const e = new Error("damn");
    const r = parse(stringify(e));
    assertEquals(e.name, r.name);
    assertEquals(e.message, r.message);
    assertEquals(e.stack, r.stack);
    assertEquals(e.cause, r.cause);
    test(new Uint8Array([3, 2, 1]));
    test(new Map([["a", "b"], ["c", "d"], ["e", "f"]]));
    test(new Set([..."hello oson"]));
    test([new Date(), new Date(Date.now() - 1000000)]);
    test([/asdf/, /jjj.+/gmi]);
  });
  it("can work with objects with circular references", () => {
    const obj: any = { a: { b: { c: 0 } } };
    obj.a.b.c = obj;
    test(obj);
    const left: any = { value: 0 };
    const right: any = { value: left };
    left.value = right;
    test([left, right]);
  });
  it("can work with objects with repeated references", () => {
    const inner = { a: { b: 42 } };
    const outer = { x: inner, y: inner };
    test(outer);
    const copy: typeof outer = parse(stringify(outer));
    copy.x.a.b++;
    assertEquals(copy.x, copy.y);
  });
  it("passes property-based string tests", () => {
    fc.assert(fc.property(fc.string(), test));
  });
  it("passed property-based object tests", () => {
    fc.assert(
      fc.property(
        fc.object({ withDate: true, withMap: true, withSet: true }),
        test,
      ),
    );
  });
  it("supports everything that JSON supports", () => {
    function testJSON(v: unknown) {
      console.log(v);
      try {
        test(v);
      } catch (e) {
        console.log(JSON.stringify(v));
        console.log(stringify(v));
        throw e;
      }
    }
    fc.assert(fc.property(fc.jsonValue(), testJSON));
    fc.assert(fc.property(fc.unicodeJsonValue(), testJSON));
  });
});
