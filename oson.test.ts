// deno-lint-ignore-file no-explicit-any
import { assertEquals } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.157.0/testing/bdd.ts";

import { delistify, listify } from "./oson.ts";

describe("listify", () => {
  it("can serialize numbers", () => {
    assertEquals(listify(3), [3]);
    assertEquals(listify(0), [0]);
    assertEquals(listify(-1), [-1]);
    assertEquals(listify(NaN), -3);
    assertEquals(listify(Infinity), -4);
    assertEquals(listify(-Infinity), -5);
  });
  it("can serialize strings", () => {
    assertEquals(listify("a"), ["a"]);
    assertEquals(listify("abc"), ["abc"]);
    assertEquals(listify(""), [""]);
  });
  it("can serialize booleans", () => {
    assertEquals(listify(true), [true]);
    assertEquals(listify(false), [false]);
  });
  it("can serialize nullish values", () => {
    assertEquals(listify(undefined), -1);
    assertEquals(listify(void 0), -1);
    assertEquals(listify(null), [null]);
  });
  it("can serialize arrays", () => {
    assertEquals(listify(["a", "b", "c"]), [[1, 2, 3], "a", "b", "c"]);
    assertEquals(listify([1, 2, 3]), [[1, 2, 3], 1, 2, 3]);
    assertEquals(listify([]), [[]]);
    assertEquals(listify([-1]), [[1], -1]);
    assertEquals(listify([0, ""]), [[1, 2], 0, ""]);
  });
  it("can serialize sparse arrays", () => {
    assertEquals(listify([]), [[]]);
    assertEquals(listify([, 1]), [[-2, 1], 1]);
    assertEquals(listify([1, , 3]), [[1, -2, 2], 1, 3]);
    assertEquals(listify([1, , 3, , 4]), [[1, -2, 2, -2, 3], 1, 3, 4]);
  });
  it("can serialize objects", () => {
    assertEquals(listify({ a: 0 }), [["o", 1, 2], "a", 0]);
    assertEquals(listify({ a: "b" }), [["o", 1, 2], "a", "b"]);
    assertEquals(listify({ a: 0, b: 1 }), [["o", 1, 2, 3, 4], "a", 0, "b", 1]);
    assertEquals(listify({}), [["o"]]);
  });
  it("can serialize nested objects", () => {
    assertEquals(listify({ a: { b: 0 } }), [
      ["o", 1, 2],
      "a",
      ["o", 3, 4],
      "b",
      0,
    ]);
    assertEquals(listify({ a: ["", 0] }), [["o", 1, 2], "a", [3, 4], "", 0]);
    assertEquals(listify({ a: 0, b: 1, c: [{ x: "a", y: ["b"] }] }), [
      ["o", 1, 2, 3, 4, 5, 6],
      "a",
      0,
      "b",
      1,
      "c",
      [7],
      ["o", 8, 1, 9, 10],
      "x",
      "y",
      [3],
    ]);
    assertEquals(listify({ v: { w: {} } }), [
      ["o", 1, 2],
      "v",
      ["o", 3, 4],
      "w",
      ["o"],
    ]);
  });
  it("can serialize objects with circular references", () => {
    const obj: any = { a: { b: { c: 0 } } };
    obj.a.b.c = obj;
    assertEquals(listify(obj), [
      ["o", 1, 2],
      "a",
      ["o", 3, 4],
      "b",
      ["o", 5, 0],
      "c",
    ]);
    const left: any = { value: 0 };
    const right: any = { value: left };
    left.value = right;
    assertEquals(listify([left, right]), [
      [1, 3],
      ["o", 2, 3],
      "value",
      ["o", 2, 1],
    ]);
  });
  it("can serialize objects with repeated references", () => {
    const inner = { a: { b: 42 } };
    const outer = { x: inner, y: inner };
    assertEquals(listify(outer), [
      ["o", 1, 2, 7, 2],
      "x",
      ["o", 3, 4],
      "a",
      ["o", 5, 6],
      "b",
      42,
      "y",
    ]);
  });
});

describe("delistify", () => {
  it("can parse numbers", () => {
    assertEquals(delistify([3]), 3);
    assertEquals(delistify([0]), 0);
    assertEquals(delistify([-1]), -1);
    assertEquals(delistify(-3), NaN);
    assertEquals(delistify(-4), Infinity);
    assertEquals(delistify(-5), -Infinity);
  });
  it("can parse strings", () => {
    assertEquals(delistify(["a"]), "a");
    assertEquals(delistify(["abc"]), "abc");
    assertEquals(delistify([""]), "");
  });
  it("can parse booleans", () => {
    assertEquals(delistify([true]), true);
    assertEquals(delistify([false]), false);
  });
  it("can parse nullish values", () => {
    assertEquals(delistify(-1), undefined);
    assertEquals(delistify(-1), void 0);
    assertEquals(delistify([null]), null);
  });
  it("can parse arrays", () => {
    assertEquals(delistify([[1, 2, 3], "a", "b", "c"]), ["a", "b", "c"]);
    assertEquals(delistify([[1, 2, 3], 1, 2, 3]), [1, 2, 3]);
    assertEquals(delistify([[]]), []);
    assertEquals(delistify([[1], -1]), [-1]);
    assertEquals(delistify([[1, 2], 0, ""]), [0, ""]);
  });
  it("can parse sparse arrays", () => {
    assertEquals(delistify([[]]), []);
    assertEquals(delistify([[-2, 1], 1]), [, 1]);
    assertEquals(delistify([[1, -2, 2], 1, 3]), [1, , 3]);
    assertEquals(delistify([[1, -2, 2, -2, 3], 1, 3, 4]), [1, , 3, , 4]);
  });
  it("can parse objects", () => {
    assertEquals(delistify([["o", 1, 2], "a", 0]), { a: 0 });
    assertEquals(delistify([["o", 1, 2], "a", "b"]), { a: "b" });
    assertEquals(delistify([["o", 1, 2, 3, 4], "a", 0, "b", 1]), {
      a: 0,
      b: 1,
    });
    assertEquals(delistify([["o"]]), {});
  });
  it("can parse nested objects", () => {
    assertEquals(delistify([["o", 1, 2], "a", ["o", 3, 4], "b", 0]), {
      a: { b: 0 },
    });
    assertEquals(delistify([["o", 1, 2], "a", [3, 4], "", 0]), { a: ["", 0] });
    assertEquals(
      delistify([
        ["o", 1, 2, 3, 4, 5, 6],
        "a",
        0,
        "b",
        1,
        "c",
        [7],
        ["o", 8, 1, 9, 10],
        "x",
        "y",
        [3],
      ]),
      { a: 0, b: 1, c: [{ x: "a", y: ["b"] }] },
    );
    assertEquals(delistify([["o", 1, 2], "v", ["o", 3, 4], "w", ["o"]]), {
      v: { w: {} },
    });
  });
  it("can parse objects with circular references", () => {
    const obj: any = { a: { b: { c: 0 } } };
    obj.a.b.c = obj;
    assertEquals(
      delistify([["o", 1, 2], "a", ["o", 3, 4], "b", ["o", 5, 0], "c"]),
      obj,
    );
    const left: any = { value: 0 };
    const right: any = { value: left };
    left.value = right;
    assertEquals(delistify([[1, 3], ["o", 2, 3], "value", ["o", 2, 1]]), [
      left,
      right,
    ]);
  });
  it("can parse objects with repeated references", () => {
    const inner = { a: { b: 42 } };
    const outer = { x: inner, y: inner };
    assertEquals(
      delistify([
        ["o", 1, 2, 7, 2],
        "x",
        ["o", 3, 4],
        "a",
        ["o", 5, 6],
        "b",
        42,
        "y",
      ]),
      outer,
    );
  });
});