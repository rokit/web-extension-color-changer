
import { ALWAYS, BACK_BTN, CHANGE_COLORS, CHANGE_LIGHTNESS, DEFAULT_STATE, FORE_BTN, GET_STATE, LINK_BTN, RESET, SET_ACTIVE_BUTTON, UPDATE_CHOSEN_COLOR, UPDATE_CONTENT } from "./constants";
import { CanvasSwatch, Color, Message, State } from "./interfaces";
import { setHslStrings } from "./utils";

let state: State = JSON.parse(JSON.stringify(DEFAULT_STATE));

// --------------------------------------------------------------------------------------------- actions
function onMessage(req: Message, _sender: any, res: any): boolean {
  switch (req.message) {
    case GET_STATE: {
      res(state);
    }; break;
    case CHANGE_COLORS: {
      onChangeColors(req.payload);
    }; break;
    case ALWAYS: {
      onAlways(req.payload);
    }; break;
    case SET_ACTIVE_BUTTON: {
      onSetActiveButton(req.payload);
    }; break;
    case UPDATE_CHOSEN_COLOR: {
      onUpdateChosenColor(req.payload);
    }; break;
    case CHANGE_LIGHTNESS: {
      onChangeLightness(req.payload);
    }; break;
    case RESET: {
      onReset();
    }; break;
    default: break;
  }

  // Allows the caller to await a response.
  return true;
}

function onChangeColors(changeColors: boolean) {
  state.changeColors = changeColors;
  saveStorageAsync(state);
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
}

function onAlways(always: boolean) {
  state.always = always;
  state.changeColors = always;

  let hostInList = state.hosts.includes(state.activeTabHostname);

  if (state.always && !hostInList) {
    state.hosts.push(state.activeTabHostname);
  } else if (!state.always && hostInList) {
    state.hosts = state.hosts.filter((x: string) => x !== state.activeTabHostname);
  }

  saveStorageAsync(state);
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
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

  saveStorageAsync(state);
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
  saveStorageAsync(state);
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
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

  saveStorageAsync(state);
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
}

/** Sets back to defaults. Does not reset:
 * changeColors
 * activeTabId
 * activeTabHostname
*/
function onReset() {
  let defaultState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.always = defaultState.always;
  state.hosts = defaultState.hosts;
  state.fg = defaultState.fg;
  state.bg = defaultState.bg;
  state.li = defaultState.li;
  state.activeBtn = defaultState.activeBtn;
  state.lightness = defaultState.lightness;

  saveStorageAsync(state);
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
}

// --------------------------------------------------------------------------------------------- tabs
/** On tab activation, get the full tab data. */
function onTabActivated(tabInfo: chrome.tabs.TabActiveInfo) {
  state.activeTabId = tabInfo.tabId;
  state.activeTabHostname = "";
  chrome.tabs.get(tabInfo.tabId, (tab: chrome.tabs.Tab) => validateTab(tab));
}

/** Check if the current tab is valid to change colors. If it is, save storage with the active tab. */
function validateTab(tab: chrome.tabs.Tab) {
  if (!tab.id || !tab.url) {
    return;
  }

  let url = new URL(tab.url);

  if (url.protocol === 'chrome:' || url.protocol === 'about:') {
    return;
  }

  state.activeTabId = tab.id;
  state.activeTabHostname = url.hostname;

  // If the hostname is found in the hosts list, the user always wants to change colors for the host.
  if (state.hosts.includes(state.activeTabHostname)) {
    state.always = true;
    state.changeColors = true;
  } else {
    state.always = false;
    state.changeColors = false;
  }
  sendTabMessage({ message: UPDATE_CONTENT, payload: state });
}

//** Send message to a tab. If the extension was reloaded, the tab will not be able to receive any messages until reloaded, hence the catch block. */
async function sendTabMessage(message: Message) {
  if (!state.activeTabId) return;
  try {
    await chrome.tabs.sendMessage(state.activeTabId, message);
  } catch (e) {
    console.log('e', e);
    // Refresh tab to reconnect.
    await chrome.tabs.reload(state.activeTabId);
  }
}

// --------------------------------------------------------------------------------------------- context menu
function createContextMenu() {
  let ctxColorChanger: object = {
    id: CHANGE_COLORS,
    title: "Change Colors",
    contexts: ["all"],
    type: "checkbox",
    checked: state.changeColors,
  };

  let ctxAlways: object = {
    id: ALWAYS,
    title: "Always",
    contexts: ["all"],
    type: "checkbox",
    checked: state.always,
  };

  chrome.contextMenus.removeAll();
  chrome.contextMenus.create(ctxColorChanger);
  chrome.contextMenus.create(ctxAlways);
  chrome.contextMenus.onClicked.removeListener(onContextMenuClicked);
  chrome.contextMenus.onClicked.addListener(onContextMenuClicked);
}

function onContextMenuClicked(info: chrome.contextMenus.OnClickData, _tab?: chrome.tabs.Tab) {
  let isChecked = info.checked ? info.checked : false;
  if (info.menuItemId === CHANGE_COLORS) {
    onChangeColors(isChecked)
  } else if (info.menuItemId === ALWAYS) {
    onAlways(isChecked)
  }
  chrome.contextMenus.update(CHANGE_COLORS, { checked: state.changeColors });
  chrome.contextMenus.update(ALWAYS, { checked: state.always });
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

// function showAboutPage(reason) {
//   chrome.tabs.create({ url: chrome.extension.getURL(`about/about.html?reason=${reason}`) });
// }

// --------------------------------------------------------------------------------------------- storage
function getStorageAsync(): Promise<State | undefined> {
  // Immediately return a promise and start asynchronous work
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.sync.get(['colorChangerState'], (result) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }

      // Pass the data retrieved from storage down the promise chain.
      resolve(result.colorChangerState);
    });
  });
}

function saveStorageAsync(state: State): Promise<boolean> {
  // Immediately return a promise and start asynchronous work
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.sync.set({ 'colorChangerState': state }, () => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      // Pass the data retrieved from storage down the promise chain.
      resolve(true);
    });
  });
}

function clearStorage() {
  chrome.storage.sync.clear();
}

// --------------------------------------------------------------------------------------------- listeners
chrome.tabs.onActivated.addListener(onTabActivated);
chrome.runtime.onMessage.addListener(onMessage);
chrome.runtime.onInstalled.addListener(onInstalled);

// --------------------------------------------------------------------------------------------- init
/** Get state from storage if it exists. If not, create default state. */
async function initServiceWorker() {
  let storageState = await getStorageAsync();
  if (storageState) {
    state = storageState;
  } else {
    await saveStorageAsync(state);
  }

  console.log('state', state);
  createContextMenu();
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