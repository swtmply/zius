/// <reference types="bun" />
import { expect, test } from "bun:test";
import { toMinor } from "./expense-values";

test("currency inputs preserve cents and reject invalid or unsafe values", () => {
  expect(toMinor("0")).toBe(0);
  expect(toMinor("10.01")).toBe(1001);
  expect(toMinor("1.1")).toBe(110);
  expect(toMinor("100.29")).toBe(10029);
  for (const value of ["", "-1", "1.001", "NaN", "Infinity", "1e3", "9007199254740991"]) {
    expect(() => toMinor(value)).toThrow();
  }
});
