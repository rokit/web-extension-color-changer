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


export function hexToHsv(hex: string) {
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = max === 0 ? 0 : delta / max;
  let v = max;

  if (delta !== 0) {
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

export function hsvToHex(h: number, s: number, v: number) {
  s /= 100;
  v /= 100;

  let r = 0,
    g = 0,
    b = 0;

  if (s === 0) {
    r = g = b = v;
  } else {
    const i = Math.floor(h / 60) % 6;
    const f = h / 60 - Math.floor(h / 60);

    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
  }

  const toHex = (num: number) =>
    Math.round(num * 255)
      .toString(16)
      .padStart(2, "0");

  return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
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
