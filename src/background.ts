
import * as c from "./constants";
import { type Color, type Message, type State, type TabActiveInfo } from "./interfaces";
import { getState, saveState, setHslStrings, shouldChangeColors, tabsQuery } from "./utils";

let state: State = JSON.parse(JSON.stringify(c.DEFAULT_STATE));
const logs = true;

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
      onChangeColor(message.payload);
    }; break;
    case c.RESET: {
      onReset();
    }; break;
    // case CONTENT_CONNECTED: {
    //   state.lostConnection = false;
    //   saveState(state);
    // }; break;
    default: break;
  }

  // Allows the caller to await a response.
  return true;
}

function onChangeColors(changeColors: boolean) {
  logs && console.log('state.activeTabHostname', state.activeTabHostname, 'state.activeTabId', state.activeTabId);
  if (!state.activeTabHostname) {
    logs && console.log('onChangeColors - No hostname');
    return
  };

  if (!state.activeTabId) {
    logs && console.log('onChangeColors - No tab ID.');
    return;
  }

  if (changeColors && !state.hosts.includes(state.activeTabHostname)) {
    state.hosts.push(state.activeTabHostname);
  } else {
    state.hosts = [...state.hosts.filter((host) => host !== state.activeTabHostname)];
  }

  updateContextMenu();
  sendTabMessage({ message: c.UPDATE_CONTENT, payload: state });
  saveState(state);
}

function onSetActiveButton(button: string) {
  state.activeBtn = button;
  saveState(state);
}

function onUpdateChosenColor() {
  // switch (state.activeBtn) {
  //   case c.FORE_BTN: {
  //     updateColor(state.fg, swatch);
  //   } break;
  //   case c.BACK_BTN: {
  //     updateColor(state.bg, swatch);
  //   } break;
  //   case c.LINK_BTN: {
  //     updateColor(state.li, swatch);
  //   } break;
  //   default: break;
  // }
  sendTabMessage({ message: c.UPDATE_CONTENT, payload: state });
  saveState(state);
}

function updateColor(color: Color) {
  // color.swatch.hue = swatch.hue;
  // color.swatch.saturation = swatch.saturation;
  // color.swatch.lightness = swatch.lightness;
  // color.swatch.chosenId = swatch.id;
  setHslStrings(color);
}

function onChangeColor(color: string) {
  // switch (state.activeBtn) {
  //   case c.FORE_BTN: {
  //     state.fg.swatch.lightness = lightness;
  //     setHslStrings(state.fg);
  //   } break;
  //   case c.BACK_BTN: {
  //     state.bg.swatch.lightness = lightness;
  //     setHslStrings(state.bg);
  //   } break;
  //   case c.LINK_BTN: {
  //     state.li.swatch.lightness = lightness;
  //     setHslStrings(state.li);
  //   } break;
  //   default: break;
  // }

  saveState(state);
  sendTabMessage({ message: c.UPDATE_CONTENT, payload: state });
}

/** Sets back to defaults. Does not reset:
 * activeTabId
 * activeTabHostname
*/
function onReset() {
  let defaultState = JSON.parse(JSON.stringify(c.DEFAULT_STATE));
  state.hosts = defaultState.hosts;
  state.fg = defaultState.fg;
  state.bg = defaultState.bg;
  state.li = defaultState.li;
  state.activeBtn = defaultState.activeBtn;
  state.lostConnection = defaultState.lostConnection;
  state.invalidUrl = defaultState.invalidUrl;

  updateContextMenu();
  sendTabMessage({ message: c.UPDATE_CONTENT, payload: state });
  saveState(state);
}

// --------------------------------------------------------------------------------------------- tabs
/** On tab activation, get the full tab data. */
function onTabActivated(tabInfo: TabActiveInfo) {
  logs && console.log('tab activated', tabInfo.tabId);
  state.activeTabId = tabInfo.tabId;
  saveState(state);
  chrome.tabs.get(tabInfo.tabId, validateTab);
}

function onTabUpdated(tabId: number, changeInfo: any, tab: chrome.tabs.Tab) {
  logs && console.log('tabUdpated', tab);
  logs && console.log('changeInfo', changeInfo);
  if (state.activeTabId === c.INVALID_TAB) {
    // Tab ID can be invalid if the browser was first loaded.
    state.activeTabId = tabId;
    validateTab(tab);
  } else if (state.activeTabId === tabId) {
    validateTab(tab);
  }
}

/** Check if the current tab is valid to change colors. If it is, save storage with the active tab. */
function validateTab(tab: chrome.tabs.Tab) {
  logs && console.log('validating tab', tab);
  state.invalidUrl = false;
  state.lostConnection = false;
  saveState(state);

  // logs && console.log('validate tab', tab);
  if (!tab.url) {
    // This may be null until the tab is updated.
    return;
  };

  let url = new URL(tab.url);
  logs && console.log('url.hostname', url.hostname);

  if (!url.hostname) {
    logs && console.log('Invalid hostname', url.hostname);
    setInvalidUrl()
    return;
  }

  if (url.protocol === 'chrome:' || url.protocol === 'about:') {
    logs && console.log('Invalid protocol', url.protocol);
    setInvalidUrl()
    return;
  }

  if (url.hostname === "addons.mozilla.org") {
    logs && console.log('Invalid hostname', url.hostname);
    setInvalidUrl()
    return;
  }

  state.activeTabHostname = url.hostname;
  saveState(state);

  updateContextMenu();
  sendTabMessage({ message: c.UPDATE_CONTENT, payload: state });
}

function setInvalidUrl() {
  state.activeTabHostname = "";
  state.invalidUrl = true;
  saveState(state);
}

//** Send message to a tab. If the extension was reloaded, the tab will not be able to receive any messages until reloaded, hence the catch block. */
async function sendTabMessage(message: Message) {
  if (!state.activeTabId) {
    logs && console.log('No active tab ID.');
    return
  };

  try {
    logs && console.log('Sent content message.');
    await chrome.tabs.sendMessage(state.activeTabId, message);
  } catch (err) {
    logs && console.log("sendTabMessage error", err);
    state.lostConnection = true;
    saveState(state);
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

  chrome.contextMenus.removeAll();
  chrome.contextMenus.create(menu);
  chrome.contextMenus.onClicked.removeListener(onContextMenuClicked);
  chrome.contextMenus.onClicked.addListener(onContextMenuClicked);
}

function onContextMenuClicked(info: chrome.contextMenus.OnClickData, _tab?: chrome.tabs.Tab) {
  if (info.menuItemId === c.CHANGE_COLORS) {
    onChangeColors(!!info.checked)
  }
}

function updateContextMenu() {
  chrome.contextMenus.update(c.CHANGE_COLORS, { checked: shouldChangeColors(state) });
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
//   chrome.tabs.create({ url: chrome.runtime.getURL(`about/about.html?reason=${reason}`) });
// }

// --------------------------------------------------------------------------------------------- storage
function clearStorage() {
  chrome.storage.sync.remove("colorChangerState");
}

// --------------------------------------------------------------------------------------------- listeners
chrome.tabs.onActivated.addListener(onTabActivated);
chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.runtime.onMessage.addListener(onMessage);
chrome.runtime.onInstalled.addListener(onInstalled);

// --------------------------------------------------------------------------------------------- init
/** Get state from storage if it exists. If not, create default state. */
async function initServiceWorker() {
  let storage = await getState();
  if (storage?.colorChangerState) {
    state = storage.colorChangerState;
  }

  // Initialize tabs.
  state.activeTabId = c.INVALID_TAB;
  state.activeTabHostname = "";

  let tabs = await tabsQuery({ currentWindow: true, active: true });
  if (tabs.length > 0) {
    let tab = tabs[0];
    if (tab.id) {
      state.activeTabId = tab.id;
      validateTab(tab);
    }
  }

  logs && console.log('state', state);

  createContextMenu();
  saveState(state);
}

initServiceWorker();

// can potentially use this to check for errors
// function hasError() {
//   if (bIsChrome && chrome.runtime.lastError) {
//       return true;
//   } else if (browser.runtime.lastError) {
//     return true;
//   }
//   return false;
// }
