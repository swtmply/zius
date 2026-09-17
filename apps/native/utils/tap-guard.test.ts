import test from "node:test";
import assert from "node:assert/strict";

import { guardTap } from "./tap-guard";

// The guard window is shared by every guarded action, so each test waits it out first.
const settle = () => new Promise((resolve) => setTimeout(resolve, 550));

test("a double tap on one action runs it once, and the next tap after the window runs", async () => {
  await settle();
  const hrefs: string[] = [];
  const push = guardTap((href: string) => hrefs.push(href));

  push("/home");
  push("/home");
  assert.deepEqual(hrefs, ["/home"]);

  await settle();
  push("/settings");
  assert.deepEqual(hrefs, ["/home", "/settings"]);
});

test("a double tap spanning two actions runs only the first", async () => {
  await settle();
  const calls: string[] = [];
  const back = guardTap(() => calls.push("back"));
  const push = guardTap(() => calls.push("push"));

  back();
  push();

  assert.deepEqual(calls, ["back"]);
});
