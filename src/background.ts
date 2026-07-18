
import * as c from "./constants";
import { type Color, type Message, type State, type TabActiveInfo } from "./interfaces";
import { setHsvStrings, shouldChangeColors } from "./utils";

if (!globalThis.browser) {
  // @ts-ignore
  globalThis.browser = chrome;
}

let state: State = JSON.parse(JSON.stringify(c.DEFAULT_STATE));

// --------------------------------------------------------------------------------------------- actions
function onMessage(message: Message, _sender: any, sendResponse: any) {
  switch (message.message) {
    case c.GET_STATE: {
      sendResponse(state)
    }; break;
    case c.CHANGE_COLORS: {
      onChangeColors(message.payload);
    }; break;
    case c.SET_ACTIVE_BUTTON: {
      onSetActiveButton(message.payload);
    }; break;
    case c.UPDATE_CHOSEN_COLOR: {
      // onUpdateChosenColor(message.payload);
    }; break;
    case c.UPDATE_COLOR: {
      onUpdateColor(message.payload.hue, message.payload.saturation, message.payload.value);
    }; break;
    case c.RESET: {
      onReset();
    }; break;
    // case CONTENT_CONNECTED: {
    //   state.lostConnection = false;
    //   browser.storage.sync.set({ 'colorChangerState': state });
    // }; break;
    default: break;
  }

  // Allows the caller to await a response.
  return true;
}

function onChangeColors(changeColors: boolean) {
  c.SHOULD_CONSOLE_LOG && console.log('state.activeTabHostname', state.activeTabHostname, 'state.activeTabId', state.activeTabId);
  if (!state.activeTabHostname) {
    c.SHOULD_CONSOLE_LOG && console.log('onChangeColors - No hostname');
    return
  };

  if (!state.activeTabId) {
    c.SHOULD_CONSOLE_LOG && console.log('onChangeColors - No tab ID.');
    return;
  }

  if (changeColors && !state.hosts.includes(state.activeTabHostname)) {
    state.hosts.push(state.activeTabHostname);
  } else {
    state.hosts = [...state.hosts.filter((host) => host !== state.activeTabHostname)];
  }

  updateContextMenu();
  sendTabMessage({ message: c.UPDATE_CONTENT, payload: state });
  browser.storage.sync.set({ 'colorChangerState': state });
}

function onSetActiveButton(button: string) {
  state.activeBtn = button;
  browser.storage.sync.set({ 'colorChangerState': state });
}

function onUpdateColor(hue: number, saturation: number, value: number) {
  switch (state.activeBtn) {
    case c.FORE_BTN: {
      state.fg.hue = hue;
      state.fg.saturation = saturation;
      state.fg.value = value;
      setHsvStrings(state.fg);
    } break;
    case c.BACK_BTN: {
      state.bg.hue = hue;
      state.bg.saturation = saturation;
      state.bg.value = value;
      setHsvStrings(state.bg);
    } break;
    case c.LINK_BTN: {
      state.li.hue = hue;
      state.li.saturation = saturation;
      state.li.value = value;
      setHsvStrings(state.li);
    } break;
    default: break;
  }

  browser.storage.sync.set({ 'colorChangerState': state });
  sendTabMessage({ message: c.UPDATE_CONTENT, payload: state });
}

/** Sets back to defaults. Does not reset:
 * activeTabId
 * activeTabHostname
*/
function onReset() {
  let defaultState = JSON.parse(JSON.stringify(c.DEFAULT_STATE)) as State;
  state.hosts = defaultState.hosts;
  state.fg = defaultState.fg;
  state.bg = defaultState.bg;
  state.li = defaultState.li;
  state.activeBtn = defaultState.activeBtn;
  state.lostConnection = defaultState.lostConnection;
  state.invalidUrl = defaultState.invalidUrl;

  updateContextMenu();
  sendTabMessage({ message: c.UPDATE_CONTENT, payload: state });
  browser.storage.sync.set({ 'colorChangerState': state });
}

// --------------------------------------------------------------------------------------------- tabs
/** On tab activation, get the full tab data. */
async function onTabActivated(tabInfo: TabActiveInfo) {
  c.SHOULD_CONSOLE_LOG && console.log('tab activated', tabInfo.tabId);
  state.activeTabId = tabInfo.tabId;
  browser.storage.sync.set({ 'colorChangerState': state });
  let tab = await browser.tabs.get(tabInfo.tabId);
  validateTab(tab);
}

function onTabUpdated(tabId: number, changeInfo: any, tab: browser.tabs.Tab) {
  c.SHOULD_CONSOLE_LOG && console.log('tabUdpated', tab);
  c.SHOULD_CONSOLE_LOG && console.log('changeInfo', changeInfo);
  if (state.activeTabId === c.INVALID_TAB) {
    // Tab ID can be invalid if the browser was first loaded.
    state.activeTabId = tabId;
    validateTab(tab);
  } else if (state.activeTabId === tabId) {
    validateTab(tab);
  }
}

/** Check if the current tab is valid to change colors. If it is, save storage with the active tab. */
function validateTab(tab: browser.tabs.Tab) {
  c.SHOULD_CONSOLE_LOG && console.log('validating tab', tab);
  state.invalidUrl = false;
  state.lostConnection = false;
  browser.storage.sync.set({ 'colorChangerState': state });

  // c.SHOULD_CONSOLE_LOG && console.log('validate tab', tab);
  if (!tab.url) {
    // This may be null until the tab is updated.
    return;
  };

  let url = new URL(tab.url);
  c.SHOULD_CONSOLE_LOG && console.log('url.hostname', url.hostname);

  if (!url.hostname) {
    c.SHOULD_CONSOLE_LOG && console.log('Invalid hostname', url.hostname);
    setInvalidUrl()
    return;
  }

  if (url.protocol === 'chrome:' || url.protocol === 'about:') {
    c.SHOULD_CONSOLE_LOG && console.log('Invalid protocol', url.protocol);
    setInvalidUrl()
    return;
  }

  if (url.hostname === "addons.mozilla.org") {
    c.SHOULD_CONSOLE_LOG && console.log('Invalid hostname', url.hostname);
    setInvalidUrl()
    return;
  }

  state.activeTabHostname = url.hostname;
  browser.storage.sync.set({ 'colorChangerState': state });

  updateContextMenu();
  sendTabMessage({ message: c.UPDATE_CONTENT, payload: state });
}

function setInvalidUrl() {
  state.activeTabHostname = "";
  state.invalidUrl = true;
  browser.storage.sync.set({ 'colorChangerState': state });
}

//** Send message to a tab. If the extension was reloaded, the tab will not be able to receive any messages until reloaded, hence the catch block. */
async function sendTabMessage(message: Message) {
  if (!state.activeTabId) {
    c.SHOULD_CONSOLE_LOG && console.log('No active tab ID.');
    return
  };

  try {
    c.SHOULD_CONSOLE_LOG && console.log('cc background - sendTabMessage: ', message);
    await browser.tabs.sendMessage(state.activeTabId, message);
  } catch (err) {
    c.SHOULD_CONSOLE_LOG && console.log("cc background - sendTabMessage error: ", err);
    state.lostConnection = true;
    browser.storage.sync.set({ 'colorChangerState': state });
  }
}

// --------------------------------------------------------------------------------------------- context menu
function createContextMenu() {
  let menu: object = {
    id: c.CHANGE_COLORS,
    title: "Change Colors",
    type: "checkbox",
    checked: shouldChangeColors(state),
  };

  browser.contextMenus.removeAll();
  browser.contextMenus.create(menu);
  browser.contextMenus.onClicked.removeListener(onContextMenuClicked);
  browser.contextMenus.onClicked.addListener(onContextMenuClicked);
}

function onContextMenuClicked(info: browser.contextMenus.OnClickData, _tab?: browser.tabs.Tab) {
  if (info.menuItemId === c.CHANGE_COLORS) {
    onChangeColors(!!info.checked)
  }
}

function updateContextMenu() {
  browser.contextMenus.update(c.CHANGE_COLORS, { checked: shouldChangeColors(state) });
}

// --------------------------------------------------------------------------------------------- installed
function onInstalled(details: any) {
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/OnInstalledReason
  if (details.reason === 'update') {
    // only do this for major versions with breaking changes
    // clearStorage(initServiceWorker);
  } else if (details.reason === 'install') {
    // showAboutPage(details.reason);
  }
}

// function showAboutPage(reason: string) {
//   browser.tabs.create({ url: browser.runtime.getURL(`about/about.html?reason=${reason}`) });
// }

// --------------------------------------------------------------------------------------------- storage
function clearStorage() {
  browser.storage.sync.remove("colorChangerState");
}

// --------------------------------------------------------------------------------------------- listeners
browser.tabs.onActivated.addListener(onTabActivated);
browser.tabs.onUpdated.addListener(onTabUpdated);
browser.runtime.onMessage.addListener(onMessage);
browser.runtime.onInstalled.addListener(onInstalled);

// --------------------------------------------------------------------------------------------- init
/** Get state from storage if it exists. If not, create default state. */
async function initServiceWorker() {
  let storage = await browser.storage.sync.get(['colorChangerState']);
  if (storage?.colorChangerState) {
    state = storage.colorChangerState;
  }

  // Initialize tabs.
  state.activeTabId = c.INVALID_TAB;
  state.activeTabHostname = "";

  let tabs = await browser.tabs.query({ currentWindow: true, active: true });

  if (tabs.length > 0) {
    let tab = tabs[0];
    if (tab.id) {
      state.activeTabId = tab.id;
      validateTab(tab);
    }
  }

  c.SHOULD_CONSOLE_LOG && console.log('state', state);

  createContextMenu();
  browser.storage.sync.set({ 'colorChangerState': state });
}

initServiceWorker();

// can potentially use this to check for errors
// function hasError() {
//   if (bIsChrome && browser.runtime.lastError) {
//       return true;
//   } else if (browser.runtime.lastError) {
//     return true;
//   }
//   return false;
// }
