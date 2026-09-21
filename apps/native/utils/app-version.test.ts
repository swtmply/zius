import assert from "node:assert/strict";
import test from "node:test";

import { isOlderVersion } from "./app-version";

test("compares major, minor, and patch app versions", () => {
  assert.equal(isOlderVersion("0.0.9", "0.1.0"), true);
  assert.equal(isOlderVersion("1.10.0", "1.9.9"), false);
  assert.equal(isOlderVersion("2.0.0", "2.0.0"), false);
});
