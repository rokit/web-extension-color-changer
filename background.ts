
import { BACK_BTN, CHANGE_COLORS, CHANGE_LIGHTNESS, CONTENT_CONNECTED, DEFAULT_STATE, FORE_BTN, GET_STATE, LINK_BTN, RESET, SET_ACTIVE_BUTTON, UPDATE_CHOSEN_COLOR, UPDATE_CONTENT } from "./constants";
import { CanvasSwatch, Color, Message, State } from "./interfaces";
import { getState, saveState, setHslStrings, shouldChangeColors } from "./utils";

let state: State = JSON.parse(JSON.stringify(DEFAULT_STATE));

// --------------------------------------------------------------------------------------------- actions
function onMessage(message: Message, _sender: any, sendResponse: any) {
  switch (message.message) {
    case GET_STATE: {
      sendResponse(state)
    }; break;
    case CHANGE_COLORS: {
      onChangeColors(message.payload);
    }; break;
    case SET_ACTIVE_BUTTON: {
      onSetActiveButton(message.payload);
    }; break;
    case UPDATE_CHOSEN_COLOR: {
      onUpdateChosenColor(message.payload);
    }; break;
    case CHANGE_LIGHTNESS: {
      onChangeLightness(message.payload);
    }; break;
    case RESET: {
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
  console.log('state.activeTabHostname', state.activeTabHostname, 'state.activeTabId', state.activeTabId);
  if (!state.activeTabHostname) {
    console.log('No hostname');
    return
  };

  if (!state.activeTabId) {
    console.log('No tab ID.');
    return;
  }

  if (changeColors && !state.hosts.includes(state.activeTabHostname)) {
    state.hosts.push(state.activeTabHostname);
  } else {
    state.hosts = [...state.hosts.filter((host) => host !== state.activeTabHostname)];
  }

  updateContextMenu();
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
  saveState(state);
}

function onSetActiveButton(button: string) {
  state.activeBtn = button;

  if (button == FORE_BTN) {
    state.lightness = state.fg.swatch.lightness;
  } else if (button == BACK_BTN) {
    state.lightness = state.bg.swatch.lightness;
  } else if (button == LINK_BTN) {
    state.lightness = state.li.swatch.lightness;
  }

  saveState(state);
}

function onUpdateChosenColor(swatch: CanvasSwatch) {
  switch (state.activeBtn) {
    case FORE_BTN: {
      updateColor(state.fg, swatch);
    } break;
    case BACK_BTN: {
      updateColor(state.bg, swatch);
    } break;
    case LINK_BTN: {
      updateColor(state.li, swatch);
    } break;
    default: break;
  }
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
  saveState(state);
}

function updateColor(color: Color, swatch: CanvasSwatch) {
  color.swatch.hue = swatch.hue;
  color.swatch.saturation = swatch.saturation;
  color.swatch.lightness = swatch.lightness;
  color.swatch.chosenId = swatch.id;
  setHslStrings(color);
}

function onChangeLightness(lightness: number) {
  state.lightness = lightness;

  switch (state.activeBtn) {
    case FORE_BTN: {
      state.fg.swatch.lightness = lightness;
      setHslStrings(state.fg);
    } break;
    case BACK_BTN: {
      state.bg.swatch.lightness = lightness;
      setHslStrings(state.bg);
    } break;
    case LINK_BTN: {
      state.li.swatch.lightness = lightness;
      setHslStrings(state.li);
    } break;
    default: break;
  }

  saveState(state);
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
}

/** Sets back to defaults. Does not reset:
 * activeTabId
 * activeTabHostname
*/
function onReset() {
  let defaultState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.hosts = defaultState.hosts;
  state.fg = defaultState.fg;
  state.bg = defaultState.bg;
  state.li = defaultState.li;
  state.activeBtn = defaultState.activeBtn;
  state.lightness = defaultState.lightness;
  state.lostConnection = defaultState.lostConnection;
  state.invalidUrl = defaultState.invalidUrl;

  updateContextMenu();
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
  saveState(state);
}

// --------------------------------------------------------------------------------------------- tabs
/** On tab activation, get the full tab data. */
function onTabActivated(tabInfo: chrome.tabs.TabActiveInfo) {
  console.log('tab activated');
  state.activeTabId = tabInfo.tabId;
  saveState(state);
  chrome.tabs.get(tabInfo.tabId, validateTab);
}

function onTabUpdated(tabId: number, changeInfo: any, tab: chrome.tabs.Tab) {
  console.log('tabUdpated', tab);
  console.log('changeInfo', changeInfo);
  if (state.activeTabId === tabId) {
    validateTab(tab);
  }
}

/** Check if the current tab is valid to change colors. If it is, save storage with the active tab. */
function validateTab(tab: chrome.tabs.Tab) {
  console.log('validating tab', tab);
  state.invalidUrl = false;
  state.lostConnection = false;
  saveState(state);

  // console.log('validate tab', tab);
  if (!tab.url) {
    // This may be null until the tab is updated.
    return;
  };

  let url = new URL(tab.url);
  console.log('url.hostname', url.hostname);

  if (!url.hostname) {
    setInvalidUrl()
    return;
  }

  if (url.protocol === 'chrome:' || url.protocol === 'about:') {
    setInvalidUrl()
    return;
  }

  if (url.hostname === "addons.mozilla.org") {
    setInvalidUrl()
    return;
  }

  state.activeTabHostname = url.hostname;
  saveState(state);

  updateContextMenu();
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
}

function setInvalidUrl() {
  state.activeTabHostname = "";
  state.invalidUrl = true;
  saveState(state);
}

//** Send message to a tab. If the extension was reloaded, the tab will not be able to receive any messages until reloaded, hence the catch block. */
async function sendTabMessage(message: Message) {
  if (!state.activeTabId) return;
  try {
    console.log('Sent content message.');
    await chrome.tabs.sendMessage(state.activeTabId, message);
  } catch (err) {
    console.log("sendTabMessage error", err);
    console.log("refreshing tab", state.activeTabHostname);
    state.lostConnection = true;
    saveState(state);
    // await chrome.tabs.reload(state.activeTabId);
  }
}

// --------------------------------------------------------------------------------------------- context menu
function createContextMenu() {
  let menu: object = {
    id: CHANGE_COLORS,
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
  if (info.menuItemId === CHANGE_COLORS) {
    onChangeColors(!!info.checked)
  }
}

function updateContextMenu() {
  chrome.contextMenus.update(CHANGE_COLORS, { checked: shouldChangeColors(state) });
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

  console.log('state', state);
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