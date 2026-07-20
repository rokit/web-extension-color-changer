import { expect, test } from "vitest";
import convert from "color-convert";

test("round-trip conversion matches original", () => {
  let hex1 = "9FCACB";
  let hsv = convert.hex.hsv.raw(hex1);
  let hex2 = convert.hsv.hex(hsv);
  expect(hex1).toBe(hex2);
});
