import convert from "color-convert";
import { type Color, type State } from "./types";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function radToDeg(radians: number) { return radians * RAD_TO_DEG; }
export function degToRad(deg: number) { return deg * DEG_TO_RAD; }

export function mapRange(
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number
): number {
  let highMinusLow = fromHigh - fromLow;
  if (highMinusLow === 0) {
    highMinusLow = Number.MIN_VALUE;
  }
  return toLow + ((value - fromLow) * (toHigh - toLow)) / highMinusLow;
}

export function createColor(hue: number, saturation: number, value: number) {
  let color: Color = {
    hsv: {
      h: hue,
      s: saturation,
      v: value,
    },
    hslString: "",
    lightnessShift: "",
    hueHovered: "",
    hueVisited: "",
  }
  setHslStrings(color);
  return color;
}

export function setHslStrings(color: Color) {
  let hsl = convert.hsv.hsl.raw(color.hsv.h, color.hsv.s, color.hsv.v);
  let h = hsl[0];
  let s = hsl[1];
  let l = hsl[2];

  color.hslString = `hsl(${h}, ${s}%, ${l}%)`;
  if (l >= 50) {
    color.lightnessShift = `hsl(${h}, ${s}%, ${l - 10}%)`;
  } else {
    color.lightnessShift = `hsl(${h}, ${s}%, ${l + 10}%)`;
  }
  color.hueHovered = `hsl(${h + 40 % 360}, ${s + 20}%, ${l}%)`;
  color.hueVisited = `hsl(${h - 40 % 360}, ${s + 20}%, ${l}%)`;
}

export function shouldChangeColors(state: State): boolean {
  if (!state.activeTabHostname) return false;
  if (!state.activeTabId) return false;

  if (state.hosts.includes(state.activeTabHostname)) {
    return true;
  } else {
    return false;
  }
}

export function roundToTenths(num: number) {
  return Math.round((num + Number.EPSILON) * 10) / 10;
}
