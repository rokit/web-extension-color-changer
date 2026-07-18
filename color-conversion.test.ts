import { expect, test } from "vitest";
import { hexToHsv, hsvToHex } from "./src/utils";

// test("conversions are the same", () => {
//   let hex = "9FCACB";
//   let hsv = convert.hex.hsv(hex);
//   let newHex = convert.hsv.hex(hsv);
//   expect(hex).toBe(newHex);
// });

test("round-trip conversion matches original", () => {
  let hex1 = "9FCACB";
  let hsv = hexToHsv(hex1);
  let hex2 = hsvToHex(hsv.h, hsv.s, hsv.v);
  expect(hex1).toBe(hex2);
});
