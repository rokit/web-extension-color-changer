
import * as c from "./constants";
import { type State, type TabActiveInfo } from "./types";
import { migrateVersion, onChangeColors, sendTabMessage, updateContextMenu } from "./utils";

if (!globalThis.browser) {
  // @ts-ignore
  globalThis.browser = chrome;
}

// --------------------------------------------------------------------------------------------- tabs
/** On tab activation, get the full tab data. */
async function onTabActivated(tabInfo: TabActiveInfo) {
  c.LOG && console.log('cc - onTabActivated - tab activated', tabInfo.tabId);

  await browser.storage.sync.set({ [c.ACTIVE_TAB_ID_KEY]: tabInfo.tabId });
  let tab = await browser.tabs.get(tabInfo.tabId);
  validateTab(tab);
}

async function onTabUpdated(tabId: number, changeInfo: any, tab: browser.tabs.Tab) {
  c.LOG && console.log('cc - onTabUpdated - tabUdpated', tab);
  c.LOG && console.log('cc - onTabUpdated - changeInfo', changeInfo);

  let { activeTabId } = await browser.storage.sync.get([c.ACTIVE_TAB_ID_KEY]);

  if (activeTabId === c.INVALID_TAB) {
    // Tab ID can be invalid if the browser was first loaded.
    await browser.storage.sync.set({ [c.ACTIVE_TAB_ID_KEY]: tabId });
    validateTab(tab);
  } else if (activeTabId === tabId) {
    validateTab(tab);
  }
}

/** Check if the current tab is valid to change colors. If it is, save storage with the active tab. */
async function validateTab(tab: browser.tabs.Tab) {
  c.LOG && console.log('cc - validateTab - validating tab', tab);

  await browser.storage.sync.set({ [c.INVALID_URL_KEY]: false });
  await browser.storage.sync.set({ [c.LOST_CONNECTION_KEY]: false });

  // c.SHOULD_CONSOLE_LOG && console.log('cc - validate tab', tab);
  if (!tab.url) {
    // This may be null until the tab is updated.
    return;
  };

  let url = new URL(tab.url);
  c.LOG && console.log('cc - validateTab - url.hostname', url.hostname);
  c.LOG && console.log('cc - validateTab - url.protocol', url.protocol);

  if (url.hostname == "") {
    c.LOG && console.log('cc - validateTab - Empty hostname');
    setInvalidUrl();
    return;
  }

  if (c.DISALLOWED_PROTOCOLS.includes(url.protocol)) {
    c.LOG && console.log('cc - validateTab - disallowed protocol', url.protocol);
    setInvalidUrl();
    return;
  }

  if (c.DISALLOWED_HOSTNAMES.includes(url.hostname)) {
    c.LOG && console.log('cc - validateTab - disallowed hostname', url.hostname);
    setInvalidUrl();
    return;
  }

  await browser.storage.sync.set({ [c.ACTIVE_TAB_HOSTNAME_KEY]: url.hostname });

  updateContextMenu();
  sendTabMessage({ message: c.UPDATE_CONTENT });
}

async function setInvalidUrl() {
  await browser.storage.sync.set({ [c.ACTIVE_TAB_HOSTNAME_KEY]: "" });
  await browser.storage.sync.set({ [c.INVALID_URL_KEY]: true });
}

// --------------------------------------------------------------------------------------------- context menu
function createContextMenu() {
  let menu = {
    id: c.CONTEXT_MENU_ID,
    title: "Change Colors",
    type: "checkbox",
    checked: false,
  } as object;

  browser.contextMenus.removeAll();
  browser.contextMenus.create(menu);
  browser.contextMenus.onClicked.removeListener(onContextMenuClicked);
  browser.contextMenus.onClicked.addListener(onContextMenuClicked);
}

function onContextMenuClicked(info: browser.contextMenus.OnClickData, _tab?: browser.tabs.Tab) {
  if (info.menuItemId === c.CONTEXT_MENU_ID) {
    onChangeColors(!!info.checked)
  }
}

// --------------------------------------------------------------------------------------------- installed
async function onInstalled(details: any) {
  c.LOG && console.log("cc - onInstalled", details);

  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/OnInstalledReason
  if (details.reason == "update") {
    c.LOG && console.log("cc - onInstalled - updating");
    await browser.storage.sync.set({ "colorChangerState": c.STATE_V4 });
    let oldState = await browser.storage.sync.get(["colorChangerState"]);
    migrateVersion(oldState["colorChangerState"]);
  } else if (details.reason == "install") {
    let state = JSON.parse(JSON.stringify(c.DEFAULT_STATE)) as State;
    await browser.storage.sync.set(state);
    // showAboutPage(details.reason);
  }
}

// function showAboutPage(reason: string) {
//   browser.tabs.create({ url: browser.runtime.getURL(`about/about.html?reason=${reason}`) });
// }

// --------------------------------------------------------------------------------------------- listeners
browser.tabs.onActivated.addListener(onTabActivated);
browser.tabs.onUpdated.addListener(onTabUpdated);
browser.runtime.onInstalled.addListener(onInstalled);

// --------------------------------------------------------------------------------------------- init
/** Get state from storage if it exists. If not, create default state. */
async function initServiceWorker() {
  c.LOG && console.log('cc - initServiceWorker');

  createContextMenu();

  // Initialize tabs.
  await browser.storage.sync.set({ [c.ACTIVE_TAB_ID_KEY]: c.INVALID_TAB });
  await browser.storage.sync.set({ [c.ACTIVE_TAB_HOSTNAME_KEY]: "" });

  let tabs = await browser.tabs.query({ currentWindow: true, active: true });

  if (tabs.length > 0) {
    let tab = tabs[0];
    if (tab.id) {
      await browser.storage.sync.set({ [c.ACTIVE_TAB_ID_KEY]: tab.id });
      validateTab(tab);
    }
  }

  updateContextMenu();
}

initServiceWorker();

// can potentially use this to check for errors
// function hasError() {
//   if (browser.runtime.lastError) {
//       return true;
//   }
//   return false;
// }
