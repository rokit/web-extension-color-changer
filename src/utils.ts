import convert from "color-convert";
import { type Color, type Message, type LocalState, type SyncState } from "./types";
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

export async function onChangeColors(changeColors: boolean) {
  let { activeTabHostname, activeTabId } = await browser.storage.local.get([c.ACTIVE_TAB_HOSTNAME_KEY, c.ACTIVE_TAB_ID_KEY]);
  let { hosts } = await browser.storage.sync.get([c.HOSTS_KEY]);

  c.LOG && console.log('cc - onChangeColors - activeTabHostname', activeTabHostname, 'activeTabId', activeTabId);
  if (!activeTabHostname) {
    c.LOG && console.log('cc - onChangeColors - No hostname');
    return;
  };

  if (!activeTabId) {
    c.LOG && console.log('cc - onChangeColors - No tab ID.');
    return;
  }

  if (changeColors && !hosts.includes(activeTabHostname)) {
    hosts.push(activeTabHostname);
  } else {
    hosts = [...hosts.filter((host: string) => host !== activeTabHostname)];
  }

  await browser.storage.sync.set({ [c.HOSTS_KEY]: hosts });
  await updateContextMenu();
  await sendTabMessage({ message: c.UPDATE_CONTENT });
}

/** Drives the initialization of the main color changer checkbox.
 *  If the url host is in the list of saved hosts, the colors should be changed, otherwise the host would have been removed.
 * */
export async function isSavedHost() {
  let { activeTabHostname } = await browser.storage.local.get([c.ACTIVE_TAB_HOSTNAME_KEY]);
  let { hosts } = await browser.storage.sync.get([c.HOSTS_KEY]);

  if (hosts.includes(activeTabHostname)) {
    c.LOG && console.log('cc - isSavedHost - true');
    return true;
  } else {
    c.LOG && console.log('cc - isSavedHost - false');
    return false;
  }
}

export async function updateContextMenu() {
  try {
    await browser.contextMenus.update(c.CONTEXT_MENU_ID, { checked: await isSavedHost() });
  } catch (e) {
    c.LOG && console.log('cc - updateContextMenu - failed: ', e);
  }
}

/** Send message to a tab. If the extension was reloaded, the tab will not be able to receive any messages until reloaded, hence the catch block. */
export async function sendTabMessage(message: Message) {
  let { activeTabId } = await browser.storage.local.get([c.ACTIVE_TAB_ID_KEY]);

  if (!activeTabId) {
    c.LOG && console.log('cc - sendTabMessage - No active tab ID.');
    return
  };

  try {
    c.LOG && console.log('cc - sendTabMessage: ', message);
    await browser.tabs.sendMessage(activeTabId, message);
  } catch (err) {
    c.LOG && console.log("cc - sendTabMessage - lost connection: ", err);
    await browser.storage.local.set({ [c.LOST_CONNECTION_KEY]: true });
  }
}

/** Try to preserve colors and hosts from old versions. */
export function migrateVersion(oldState: any) {
  let newState: any = JSON.parse(JSON.stringify(c.DEFAULT_SYNC_STATE)) as SyncState;

  c.LOG && console.log('cc - migrateVersion - oldState:', oldState);
  c.LOG && console.log('cc - migrateVersion - newState:', newState);

  if (Object.hasOwn(oldState, "version") && oldState.version == newState.version) {
    // We're using the current version's state.
    c.LOG && console.log('cc - migrateVersion - return old state.');
    return oldState;
  }

  // update to new state
  if (Object.hasOwn(oldState, "hosts")) {
    c.LOG && console.log('cc - migrateVersion - migrate hosts.');
    newState.hosts = oldState.hosts;
  }

  if (Object.hasOwn(oldState, "fg") && Object.hasOwn(oldState.fg, "swatch")) {
    let hsl = oldState.fg.swatch;
    let hsv = convert.hsl.hsv.raw(hsl.hue, hsl.saturation, hsl.lightness);
    newState.text = createColor(hsv[0], hsv[1], hsv[2]);
    c.LOG && console.log('cc - migrateVersion - migrate text.');
  }

  if (Object.hasOwn(oldState, "bg") && Object.hasOwn(oldState.bg, "swatch")) {
    let hsl = oldState.bg.swatch;
    let hsv = convert.hsl.hsv.raw(hsl.hue, hsl.saturation, hsl.lightness);
    newState.background = createColor(hsv[0], hsv[1], hsv[2]);
    c.LOG && console.log('cc - migrateVersion - migrate background.');
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
    c.LOG && console.log('cc - migrateVersion - migrate links.');
  }

  c.LOG && console.log('cc - migrateVersion - final state:', newState);
  browser.storage.sync.set(newState);
}

export function createColorV4(hue: number, saturation: number, lightness: number) {
  let color: any = {
    swatch: {
      hue,
      saturation,
      lightness,
    },
  }
  return color;
}