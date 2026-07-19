import convert from "color-convert";
import { type Color, type Message, type State } from "./interfaces";

// export const isChrome = /Chrome/.test(navigator.userAgent);

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
    hue,
    saturation,
    value,
    hsl: "",
    valueShift: "",
    hueHovered: "",
    hueVisited: "",
    alpha: "",
  }
  setHslStrings(color);
  return color;
}

export function setHslStrings(color: Color) {
  let hsl = convert.hsv.hsl.raw(color.hue, color.saturation, color.value);
  let h = hsl[0];
  let s = hsl[1];
  let l = hsl[2];

  color.hsl = `hsl(${h}, ${s}%, ${l}%)`;
  if (l >= 50) {
    color.valueShift = `hsl(${h}, ${s}%, ${l - 10}%)`;
  } else {
    color.valueShift = `hsl(${h}, ${s}%, ${l + 10}%)`;
  }
  color.hueHovered = `hsl(${h + 40 % 360}, ${s + 20}%, ${l}%)`;
  color.hueVisited = `hsl(${h - 40 % 360}, ${s + 20}%, ${l}%)`;
  color.alpha = `hsla(${h}, ${s}%, ${l}%, 0.5)`;
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

// /** Workaround for not being able to await an async message with chrome.runtime in Firefox.
//  * https://bugzilla.mozilla.org/show_bug.cgi?id=1228044
// */
// export function runtimeSendMessage(message: Message): Promise<any> {
//   if (isChrome) {
//     return chrome.runtime.sendMessage(message);
//   } else {
//     return browser.runtime.sendMessage(message);
//   }
// }

// export function saveState(state: State) {
//   if (isChrome) {
//     chrome.storage.sync.set({ 'colorChangerState': state });
//   } else {
//     browser.storage.sync.set({ 'colorChangerState': state });
//   }
// }

// export function getState() {
//   if (isChrome) {
//     return chrome.storage.sync.get(['colorChangerState']);
//   } else {
//     return browser.storage.sync.get(['colorChangerState']);
//   }
// }

// export function tabsQuery(query: any) {
//   if (isChrome) {
//     return chrome.tabs.query(query);
//   } else {
//     return browser.tabs.query(query) as Promise<chrome.tabs.Tab[]>;
//   }
// }
