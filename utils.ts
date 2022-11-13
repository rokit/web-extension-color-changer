import { Color, Message, State } from "./interfaces";

export const isChrome = /Chrome/.test(navigator.userAgent);

export function createColor(hue: number, saturation: number, lightness: number, chosenId: string): Color {
  let color: Color = {
    swatch: {
      hue,
      saturation,
      lightness,
      chosenId,
    },
    hsl: "",
    lightnessShift: "",
    hueHovered: "",
    hueVisited: "",
    alpha: "",
  }
  setHslStrings(color);
  return color;
}

export function setHslStrings(color: Color) {
  color.hsl = `hsl(${color.swatch.hue}, ${color.swatch.saturation}%, ${color.swatch.lightness}%)`;
  if (color.swatch.lightness >= 50) {
    color.lightnessShift = `hsl(${color.swatch.hue}, ${color.swatch.saturation}%, ${color.swatch.lightness - 10}%)`;
  } else {
    color.lightnessShift = `hsl(${color.swatch.hue}, ${color.swatch.saturation}%, ${color.swatch.lightness + 10}%)`;
  }
  color.hueHovered = `hsl(${color.swatch.hue + 40 % 360}, ${color.swatch.saturation + 20}%, ${color.swatch.lightness}%)`;
  color.hueVisited = `hsl(${color.swatch.hue - 40 % 360}, ${color.swatch.saturation + 20}%, ${color.swatch.lightness}%)`;
  color.alpha = `hsla(${color.swatch.hue}, ${color.swatch.saturation}%, ${color.swatch.lightness}%, 0.5)`;
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

/** Workaround for not being able to await an async message with chrome.runtime in Firefox.
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1228044
*/
export function runtimeSendMessage(message: Message): Promise<any> {
  if (isChrome) {
    return chrome.runtime.sendMessage(message);
  } else {
    return browser.runtime.sendMessage(message);
  }
}

export function saveState(state: State) {
  if (isChrome) {
    chrome.storage.sync.set({ 'colorChangerState': state });
  } else {
    browser.storage.sync.set({ 'colorChangerState': state });
  }
}

export function getState() {
  if (isChrome) {
    return chrome.storage.sync.get(['colorChangerState']);
  } else {
    return browser.storage.sync.get(['colorChangerState']);
  }
}

export function tabsQuery(query: any) {
  if (isChrome) {
    return chrome.tabs.query(query);
  } else {
    return browser.tabs.query(query) as Promise<chrome.tabs.Tab[]>;
  }
}
