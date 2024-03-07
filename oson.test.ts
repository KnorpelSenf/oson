// deno-lint-ignore-file no-explicit-any
import {
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
} from "https://deno.land/std@0.218.2/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.218.2/testing/bdd.ts";

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
  it("can serialize bigints values", () => {
    assertEquals(listify(0n), [[-6, "0"]]);
    assertEquals(listify(-3n), [[-6, "-3"]]);
    assertEquals(
      listify(34632049865209468204965n),
      [[-6, 34632049865209468204965n.toString(16)]],
    );
    assertEquals(
      listify(-1314293875349763465329750293542387n),
      [[-6, (-1314293875349763465329750293542387n).toString(16)]],
    );
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
    assertEquals(listify([1, , , , -1, ,]), [[1, -2, -2, -2, 2, -2], 1, -1]);
  });
  it("can serialize objects", () => {
    assertEquals(listify({ a: 0 }), [["", 1, 2], "a", 0]);
    assertEquals(listify({ a: "b" }), [["", 1, 2], "a", "b"]);
    assertEquals(listify({ a: 0, b: 1 }), [["", 1, 2, 3, 4], "a", 0, "b", 1]);
    assertEquals(listify({}), [[""]]);
  });
  it("can serialize built-in containers", () => {
    const error = new Error("msg");
    delete error.stack;
    assertEquals(listify(error), [["Error", 1, 2], "Error", "msg"]);
    error.name = "name";
    assertEquals(listify(error), [["Error", 1, 2], "name", "msg"]);
    error.cause = error;
    assertEquals(listify(error), [["Error", 1, 2, -1, 0], "name", "msg"]);
    assertEquals(listify(new Map()), [["Map"]]);
    assertEquals(listify(new Map().set("a", 0)), [["Map", 1], [2, 3], "a", 0]);
    assertEquals(listify(new Set()), [["Set"]]);
    assertEquals(listify(new Set().add("a")), [["Set", 1], "a"]);
    assertEquals(listify(new URL("http://example.com/path?param#route")), [
      ["URL", 1],
      "http://example.com/path?param#route",
    ]);
  });
  it("can serialize nested objects", () => {
    assertEquals(listify({ a: { b: 0 } }), [
      ["", 1, 2],
      "a",
      ["", 3, 4],
      "b",
      0,
    ]);
    assertEquals(listify({ a: ["", 0] }), [["", 1, 2], "a", [3, 4], "", 0]);
    assertEquals(listify({ a: 0, b: 1, c: [{ x: "a", y: ["b"] }] }), [
      ["", 1, 2, 3, 4, 5, 6],
      "a",
      0,
      "b",
      1,
      "c",
      [7],
      ["", 8, 1, 9, 10],
      "x",
      "y",
      [3],
    ]);
    assertEquals(listify({ v: { w: {} } }), [
      ["", 1, 2],
      "v",
      ["", 3, 4],
      "w",
      [""],
    ]);
  });
  it("can serialize objects with circular references", () => {
    const obj: any = { a: { b: { c: 0 } } };
    obj.a.b.c = obj;
    assertEquals(listify(obj), [
      ["", 1, 2],
      "a",
      ["", 3, 4],
      "b",
      ["", 5, 0],
      "c",
    ]);
    const left: any = { value: 0 };
    const right: any = { value: left };
    left.value = right;
    assertEquals(listify([left, right]), [
      [1, 3],
      ["", 2, 3],
      "value",
      ["", 2, 1],
    ]);
  });
  it("can serialize objects with repeated references", () => {
    const inner = { a: { b: 42 } };
    const outer = { x: inner, y: inner };
    assertEquals(listify(outer), [
      ["", 1, 2, 7, 2],
      "x",
      ["", 3, 4],
      "a",
      ["", 5, 6],
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
  it("can parse bigints values", () => {
    assertEquals(delistify([[-6, "0"]]), 0n);
    assertEquals(delistify([[-6, "-3"]]), -3n);
    assertEquals(
      delistify([[-6, 34632049865209468204965n.toString(16)]]),
      34632049865209468204965n,
    );
    assertEquals(
      delistify([[-6, (-1314293875349763465329750293542387n).toString(16)]]),
      -1314293875349763465329750293542387n,
    );
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
    assertEquals(delistify([["", 1, 2], "a", 0]), { a: 0 });
    assertEquals(delistify([["", 1, 2], "a", "b"]), { a: "b" });
    assertEquals(delistify([["", 1, 2, 3, 4], "a", 0, "b", 1]), {
      a: 0,
      b: 1,
    });
    assertEquals(delistify([[""]]), {});
  });
  it("can parse built-in containers", () => {
    assertInstanceOf(delistify([["Error", 1, 2], "Error", "msg"]), Error);
    assertEquals(delistify([["Error", 1, 2], "name", "msg"]).name, "name");
    assertEquals(
      delistify([["Error", 1, 2, 3], "name", "msg", "my-stack"]).stack,
      "my-stack",
    );
    const err = delistify([["Error", 1, 2, -1, 0], "name", "msg"]);
    assertStrictEquals(err, err.cause);
    assertEquals(delistify([["Map"]]), new Map());
    assertEquals(
      delistify([["Map", 1], [2, 3], "a", 0]),
      new Map().set("a", 0),
    );
    assertEquals(delistify([["Set"]]), new Set());
    assertEquals(delistify([["Set", 1], "a"]), new Set().add("a"));
    assertEquals(
      delistify([["URL", 1], "http://example.com/path?param#route"]),
      new URL("http://example.com/path?param#route"),
    );
  });
  it("can parse nested objects", () => {
    assertEquals(delistify([["", 1, 2], "a", ["", 3, 4], "b", 0]), {
      a: { b: 0 },
    });
    assertEquals(delistify([["", 1, 2], "a", [3, 4], "", 0]), { a: ["", 0] });
    assertEquals(
      delistify([
        ["", 1, 2, 3, 4, 5, 6],
        "a",
        0,
        "b",
        1,
        "c",
        [7],
        ["", 8, 1, 9, 10],
        "x",
        "y",
        [3],
      ]),
      { a: 0, b: 1, c: [{ x: "a", y: ["b"] }] },
    );
    assertEquals(delistify([["", 1, 2], "v", ["", 3, 4], "w", [""]]), {
      v: { w: {} },
    });
  });
  it("can parse objects with circular references", () => {
    const obj: any = { a: { b: { c: 0 } } };
    obj.a.b.c = obj;
    assertEquals(
      delistify([["", 1, 2], "a", ["", 3, 4], "b", ["", 5, 0], "c"]),
      obj,
    );
    const left: any = { value: 0 };
    const right: any = { value: left };
    left.value = right;
    assertEquals(delistify([[1, 3], ["", 2, 3], "value", ["", 2, 1]]), [
      left,
      right,
    ]);
  });
  it("can parse objects with repeated references", () => {
    const inner = { a: { b: 42 } };
    const outer = { x: inner, y: inner };
    assertEquals(
      delistify([
        ["", 1, 2, 7, 2],
        "x",
        ["", 3, 4],
        "a",
        ["", 5, 6],
        "b",
        42,
        "y",
      ]),
      outer,
    );
  });
});
