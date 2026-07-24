
import * as c from "./constants";
import { type SyncState, type TabActiveInfo } from "./types";
import { migrateVersion, onChangeColors, sendTabMessage, updateContextMenu } from "./utils";

if (!globalThis.browser) {
  // @ts-ignore
  globalThis.browser = chrome;
}

// --------------------------------------------------------------------------------------------- tabs
/** Triggers when user clicks a tab, makes a new one, or deletes one.
 * The tab could be blank or already populated with a page.
 */
async function onTabActivated(tabInfo: TabActiveInfo) {
  c.LOG && console.log('cc - onTabActivated - tabInfo', tabInfo);

  await browser.storage.local.set({ [c.ACTIVE_TAB_ID_KEY]: tabInfo.tabId });
  let tab = await browser.tabs.get(tabInfo.tabId);
  validateTab(tab);
}

/** Firefox seems to always send a changeInfo.url update on reloaded tabs, but chrome doesn't.
 *  We could listen for status == "complete", but that is not guaranteed to happen.
 *  Since there doesn't seem to be a good way to get the final url of the tab,
 *  we validate on every update.
 */
async function onTabUpdated(tabId: number, changeInfo: browser.tabs._OnUpdatedChangeInfo, tab: browser.tabs.Tab) {
  // c.LOG && console.log('------------------------------');
  // c.LOG && console.log('cc - onTabUpdated - changeInfo', changeInfo);
  // c.LOG && console.log('cc - onTabUpdated - tabUdpated', tab);

  let { activeTabId } = await browser.storage.local.get([c.ACTIVE_TAB_ID_KEY]);

  // If multiple tabs are loading, we only care about the one we're currently on.
  if (activeTabId === tabId) {
    validateTab(tab);
  }
}

/** Check if the current tab is valid to change colors. If it is, save the hostname to storage. */
async function validateTab(tab: browser.tabs.Tab) {
  c.LOG && console.log('cc - validateTab - tab', tab);

  await browser.storage.local.set({
    [c.INVALID_URL_KEY]: false,
    [c.LOST_CONNECTION_KEY]: false
  });

  // The spec says url can be undefined though I've never seen it.
  // I have seen an empty url in chrome for new tabs.
  // If we can't make a url for any reason, just return.
  let url;
  try {
    url = new URL(tab.url || "");
  } catch (e) {
    c.LOG && console.log('cc - validateTab - url could not be made', tab);
    setInvalidUrl();
    return;
  }

  c.LOG && console.log('cc - validateTab - url.hostname', url.hostname, 'url.protocol', url.protocol);

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

  c.LOG && console.log('cc - validateTab - tab is valid, setting hostname: ', url.hostname);
  await browser.storage.local.set({ [c.ACTIVE_TAB_HOSTNAME_KEY]: url.hostname });

  updateContextMenu();
  sendTabMessage({ message: c.UPDATE_CONTENT });
}

async function setInvalidUrl() {
  await browser.storage.local.set({
    [c.ACTIVE_TAB_HOSTNAME_KEY]: "",
    [c.INVALID_URL_KEY]: true
  });
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
async function onInstalled(details: browser.runtime._OnInstalledDetails) {
  c.LOG && console.log("cc - onInstalled", details);

  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/OnInstalledReason
  if (details.reason == "update") {
    if (details.previousVersion) {
      let oldVersion = parseInt(details.previousVersion.split(".")[0]);
      if (oldVersion < 5) {
        // await browser.storage.sync.set({ "colorChangerState": c.STATE_V4 });
        let oldState = await browser.storage.sync.get(["colorChangerState"]);
        migrateVersion(oldState["colorChangerState"]);
        await browser.storage.sync.remove("colorChangerState");
      }
    }
  } else if (details.reason == "install") {
    let state = JSON.parse(JSON.stringify(c.DEFAULT_SYNC_STATE)) as SyncState;
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

  // Initialize local state.
  await browser.storage.local.set({
    [c.ACTIVE_TAB_ID_KEY]: c.INVALID_TAB,
    [c.ACTIVE_TAB_HOSTNAME_KEY]: "",
    [c.INVALID_URL_KEY]: true,
    [c.LOST_CONNECTION_KEY]: false,
  });

  let tabs = await browser.tabs.query({ currentWindow: true, active: true });

  if (tabs.length > 0) {
    let tab = tabs[0];
    if (tab.id) {
      await browser.storage.local.set({ [c.ACTIVE_TAB_ID_KEY]: tab.id });
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
