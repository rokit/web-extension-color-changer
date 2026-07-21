import convert from "color-convert";
import { type Color, type State } from "./types";
import * as c from "./constants";

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

/** Try to preserve colors and hosts from old versions. */
export function migrateVersion(oldState: any) {
  let newState: State = JSON.parse(JSON.stringify(c.DEFAULT_STATE));

  c.LOG && console.log('cc - migrateVersion - oldState:', oldState);

  if (Object.hasOwn(oldState, "version") && oldState.version == newState.version) {
    // We're using the current version's state.
    return oldState;
  }

  // update to new state
  if (Object.hasOwn(oldState, "hosts")) {
    newState.hosts = oldState.hosts;
  }

  if (Object.hasOwn(oldState, "fg") && Object.hasOwn(oldState.fg, "swatch")) {
    let hsl = oldState.fg.swatch;
    let hsv = convert.hsl.hsv.raw(hsl.hue, hsl.saturation, hsl.lightness);
    newState.text = createColor(hsv[0], hsv[1], hsv[2]);
  }

  if (Object.hasOwn(oldState, "bg") && Object.hasOwn(oldState.bg, "swatch")) {
    let hsl = oldState.bg.swatch;
    let hsv = convert.hsl.hsv.raw(hsl.hue, hsl.saturation, hsl.lightness);
    newState.background = createColor(hsv[0], hsv[1], hsv[2]);
  }

  if (Object.hasOwn(oldState, "li") && Object.hasOwn(oldState.li, "swatch")) {
    let hsl = oldState.li.swatch;
    let hsv = convert.hsl.hsv.raw(hsl.hue, hsl.saturation, hsl.lightness);
    newState.link = createColor(hsv[0], hsv[1], hsv[2]);

    let hoveredHue = (hsl.hue + 40) % 360
    let hoveredSat = hsl.saturation + 20;
    let hoveredHsv = convert.hsl.hsv.raw(hoveredHue, hoveredSat, hsl.lightness);
    newState.linkHovered = createColor(hoveredHsv[0], hoveredHsv[1], hoveredHsv[2]);

    let visitedHue = (hsl.hue - 40) % 360;
    let visitedSat = hsl.saturation + 20;
    let visitedHsv = convert.hsl.hsv.raw(visitedHue, visitedSat, hsl.lightness);
    newState.linkHovered = createColor(visitedHsv[0], visitedHsv[1], visitedHsv[2]);
  }

  return newState;
}