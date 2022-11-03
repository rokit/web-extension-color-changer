// var bIsChrome = /Chrome/.test(navigator.userAgent);
// var className = "color-changer-v4";
// var contextMenuCreated = false;

import { ALWAYS, CHANGE_COLORS, CHANGE_LIGHTNESS, GET_STATE, RESET, SET_ACTIVE_BUTTON, UPDATE_CHOSEN_COLOR, UPDATE_CONTENT } from "./constants";
import { Color, Message, State, Swatch } from "./interfaces";

let state: State = {
  changeColors: false,
  always: false,
  activeTabId: null,
  activeTabHostname: "",
  fg: createColor(0, 0, 80, 'zero'),
  bg: createColor(0, 0, 25, 'zero'),
  li: createColor(68, 80, 80, '2-6'),
  activeBtn: 'fore',
  lightness: 80,
  hosts: [],
}

function createColor(hue: number, saturation: number, lightness: number, chosenId: string): Color {
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
  initHslStrings(color);
  return color;
}

function initHslStrings(color: Color) {
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

function updateColor(color: Color, swatch: Swatch) {
  color.swatch = swatch;
  initHslStrings(color);
}

// // can potentially use this to check for errors
// // function hasError() {
// //   if (bIsChrome && chrome.runtime.lastError) {
// //       return true;
// //   } else if (browser.runtime.lastError) {
// //     return true;
// //   }
// //   return false;
// // }

function onChangeColors(changeColors: boolean) {
  state.changeColors = changeColors;
  saveStorageAsync(state);
  sendTabMessage(UPDATE_CONTENT);
}

function onAlways(always: boolean) {
  state.always = always;
  state.changeColors = always;

  let hostInList = state.hosts.includes(state.activeTabHostname);

  if (state.always && !hostInList) {
    state.hosts.push(state.activeTabHostname);
  } else if (!state.always && hostInList) {
    state.hosts = state.hosts.filter(x => x !== state.activeTabHostname);
  }

  saveStorageAsync(state);
  sendTabMessage(UPDATE_CONTENT);
}

// function onContextMenuClicked(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
//   if (info.menuItemId === "changeColors") {
//     onChangeColors(info.checked)
//   } else if (info.menuItemId === "always") {
//     onAlways(info.checked)
//   }
// }

// function createContextMenu() {
//   getStorage(null, state => {
//     let ctxColorChanger: object = {
//       id: "changeColors",
//       title: "Change Colors",
//       contexts: ["all"],
//       type: "checkbox",
//       checked: state.changeColors,
//     };

//     let ctxAlways: object = {
//       id: "always",
//       title: "Always",
//       contexts: ["all"],
//       type: "checkbox",
//       checked: state.always,
//     };

//     chrome.contextMenus.removeAll();
//     chrome.contextMenus.create(ctxColorChanger);
//     chrome.contextMenus.create(ctxAlways);
//     chrome.contextMenus.onClicked.removeListener(onContextMenuClicked);
//     chrome.contextMenus.onClicked.addListener(onContextMenuClicked);
//     contextMenuCreated = true;
//   });
// }

// function updateContextMenu(changeColors, always) {
//   if (!contextMenuCreated) return;
//   chrome.contextMenus.update('changeColors', { checked: changeColors });
//   chrome.contextMenus.update('always', { checked: always });
// }



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
  sendTabMessage(UPDATE_CONTENT);
}

// function onTabSwitch() {
//   getStorage(null, state => {
//     if (!state.activeTabId) return;

//     chrome.tabs.executeScript(state.activeTabId, {
//       code: `document.documentElement.classList.contains('${className}')`
//     }, results => tabExecuteScriptCallback(results, state));
//   });
// }

function onStorageChanged(changes: object, areaName: string) {
  console.log('changes', changes);
  console.log('areaName', areaName);
  // getStorage(null, state => {
  // if state is empty, return
  // state can be empty when clearing storage
  // if (Object.keys(state).length === 0 && state.constructor === Object) {
  //   return;
  // }

  // on every change of state, update the context menu
  // updateContextMenu(state.changeColors, state.always);
  // });
}

// function onUpdateChosenColor(payload) {
//   getStorage(null, state => {
//     switch (state.activeBtn) {
//       case "fore": {
//         updateColor(state.fg, payload);
//         saveStorage({
//           fg: state.fg,
//           lightness: state.fg.lightness,
//         }, () => onChangeColors(true));

//       } break;
//       case "back": {
//         updateColor(state.bg, payload);
//         saveStorage({
//           bg: state.bg,
//           lightness: state.bg.lightness,
//         }, () => onChangeColors(true));
//       } break;
//       case "link": {
//         updateColor(state.li, payload);
//         saveStorage({
//           li: state.li,
//           lightness: state.li.lightness,
//         }, () => onChangeColors(true));
//       } break;
//       default: break;
//     }
//   });
// }

// function onUpdateStrings() {
//   getStorage(null, state => {
//     switch (state.activeBtn) {
//       case "fore": {
//         createStrings(state.fg);
//         saveStorage({
//           fg: state.fg,
//         }, () => onChangeColors(true));
//       } break;
//       case "back": {
//         createStrings(state.bg);
//         saveStorage({
//           bg: state.bg,
//         }, () => onChangeColors(true));
//       } break;
//       case "link": {
//         createStrings(state.li);
//         saveStorage({
//           li: state.li,
//         }, () => onChangeColors(true));
//       } break;
//       default: break;
//     }
//   });
// }

// // saves defaults
// function onReset() {
//   // don't reset:
//   // colorChanger
//   // activeTabId
//   // activeTabHostname

//   const stateToReset = {
//     always,
//     hosts,
//     fg,
//     bg,
//     li,
//     activeBtn,
//     lightness,
//   };

//   saveStorage(stateToReset, () => {
//     getStorage(null, state => {
//       if (state.changeColors) {
//         sendTabMessage(state.activeTabId, 'update', null, null);
//       }
//     })
//   });
// }

// function onChangeLightness(lightness) {
//   getStorage(null, state => {
//     switch (state.activeBtn) {
//       case 'fore': {
//         state.fg.lightness = lightness;
//         createStrings(state.fg);
//         saveStorage({ lightness, fg: state.fg }, () => onChangeColors(true));
//       } break;
//       case 'back': {
//         state.bg.lightness = lightness;
//         createStrings(state.bg);
//         saveStorage({ lightness, bg: state.bg }, () => onChangeColors(true));
//       } break;
//       case 'link': {
//         state.li.lightness = lightness;
//         createStrings(state.li);
//         saveStorage({ lightness, li: state.li }, () => onChangeColors(true));
//       } break;
//       default: break;
//     }
//   });
// }

//** Send message to a tab. If the extension was reloaded, the tab will not be able to receive any messages until reloaded, hence the catch block. */
async function sendTabMessage(message: string) {
  if (!state.activeTabId) return;
  try {
    await chrome.tabs.sendMessage(state.activeTabId, { message, payload: state });
  } catch (e) {
    await chrome.tabs.reload(state.activeTabId);
    // add please refresh tab to UI.
    console.log('estate', state);
    console.log('e', e);
  }
}

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

    }; break;
    case UPDATE_CHOSEN_COLOR: {

    }; break;
    case CHANGE_LIGHTNESS: {

    }; break;
    case RESET: {

    }; break;
    // case "save-state": {
    //   if (!req.payload) {
    //     console.log("Attempted to save state without a state object.");
    //     return;
    //   };
    //   state = req.payload;
    //   saveStorageAsync(state)
    // }; break;
    // case 'updateColor': onUpdateChosenColor(req.payload); break;
    // case 'updateStrings': onUpdateStrings(); break;
    // case 'reset': onReset(); break;
    // case 'changeLightness': onChangeLightness(req.payload); break;
    // case 'always': onAlways(req.payload); break;
  }

  return true;
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
chrome.storage.onChanged.addListener(onStorageChanged);
chrome.runtime.onInstalled.addListener(onInstalled);

// --------------------------------------------------------------------------------------------- init
/** If state hasn't been previously set in storage, initialize it, otherwise overwrite the default state. */
async function initServiceWorker() {
  let storageState = await getStorageAsync();
  if (storageState) {
    state = storageState;
  } else {
    await saveStorageAsync(state);
  }

  console.log('state', state);
  // createContextMenu();
}

initServiceWorker();
