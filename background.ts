// var bIsChrome = /Chrome/.test(navigator.userAgent);
// var className = "color-changer-v4";
// var contextMenuCreated = false;

import { Color, State, Swatch } from "./interfaces";

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

// defaults
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

// // can potentially use this to check for errors
// // function hasError() {
// //   if (bIsChrome && chrome.runtime.lastError) {
// //       return true;
// //   } else if (browser.runtime.lastError) {
// //     return true;
// //   }
// //   return false;
// // }

// function onChangeColors(changeColors) {
//   saveStorage({ changeColors }, () => {
//     getStorage(null, state => {
//       if (!changeColors && state.always) {
//         onAlways(false);
//       }
//       sendTabMessage(state.activeTabId, 'update', null, null);
//     });
//   })
// }

// function onAlways(always) {
//   saveStorage({ always }, () => {
//     getStorage(null, state => {
//       let index = state.hosts.indexOf(state.activeTabHostname);
//       if (state.always && index === -1) {
//         state.hosts.push(state.activeTabHostname);
//         saveStorage({ hosts: [...state.hosts] }, null);
//         onChangeColors(true);
//       } else if (!state.always && index > -1) {
//         state.hosts.splice(index, 1);
//         saveStorage({ hosts: [...state.hosts] }, null);
//       }
//     })
//   });
// }

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

function tabsQueryCallback(tabInfo: chrome.tabs.TabActiveInfo, tabs: chrome.tabs.Tab[]) {
  console.log('tabInfo', tabInfo);
  const activeTabId = tabInfo.tabId;
  let firstTab = tabs[0];

  if (!firstTab || !firstTab.url) {
    return;
  }

  let url = new URL(firstTab.url);
  let activeTabHostname = url.hostname;

  if (url.protocol !== 'chrome:' && url.protocol !== 'about:') {
    // saveStorage({ activeTabHostname, activeTabId }, onTabSwitch);
  }
}

// on tab activation get tabid and hostname
function onTabActivated(tabInfo: chrome.tabs.TabActiveInfo) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => tabsQueryCallback(tabInfo, tabs));
}

// function tabExecuteScriptCallback(results, state) {
//   let index = state.hosts.indexOf(state.activeTabHostname);

//   if (index > -1) {
//     saveStorage({ always: true }, () => onChangeColors(true));
//   } else {
//     saveStorage({ always: false }, () => onChangeColors(results[0]));
//   }
// }

// function onTabSwitch() {
//   getStorage(null, state => {
//     if (!state.activeTabId) return;

//     chrome.tabs.executeScript(state.activeTabId, {
//       code: `document.documentElement.classList.contains('${className}')`
//     }, results => tabExecuteScriptCallback(results, state));
//   });
// }

// ch = changes
function onStorageChanged(changes: object, areaName: string) {
  console.log('changes', changes);
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

// // gets or initializes a property, then saves
// function initState() {
//   let stateToGetOrInitialize = {
//     changeColors,
//     always,
//     hosts,
//     activeTabHostname,
//     fg,
//     bg,
//     li,
//     activeBtn,
//     lightness,
//   };

//   getStorage(stateToGetOrInitialize, state => {
//     saveStorage(state, createContextMenu);
//   });
// }

// function getStorage(obj, response) {
//   response = response || (() => { });
//   chrome.storage.sync.get(obj, response);
// }

// function saveStorage(obj, response) {
//   response = response || (() => { });
//   if (chrome.runtime.lastError) return;
//   chrome.storage.sync.set({ ...obj }, response);
// }

// function clearStorage(response) {
//   response = response || (() => { });
//   chrome.storage.sync.clear(response);
// }

// function sendTabMessage(activeTabId, message, payload, response) {
//   if (!activeTabId) return;
//   chrome.tabs.sendMessage(activeTabId, { message, payload }, response);
// }

function onMessage(req, sender, res) {
  console.log('req', req);
  console.log('sender', sender);
  switch (req.message) {
    // case 'updateColor': onUpdateChosenColor(req.payload); break;
    // case 'updateStrings': onUpdateStrings(); break;
    // case 'reset': onReset(); break;
    // case 'changeLightness': onChangeLightness(req.payload); break;
    // case 'changeColors': onChangeColors(req.payload); break;
    // case 'always': onAlways(req.payload); break;
    default: break;
  }
}

// function showAboutPage(reason) {
//   chrome.tabs.create({ url: chrome.extension.getURL(`about/about.html?reason=${reason}`) });
// }

function onInstalled(details: any) {
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/OnInstalledReason
  if (details.reason === 'update') {
    // only do this for major versions with breaking changes
    // clearStorage(initState);
  } else if (details.reason === 'install') {
    // showAboutPage(details.reason);
  }
}

function getStorageAsync() {
  // Immediately return a promise and start asynchronous work
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.sync.get(['colorChangerState'], (result) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }

      if (!result.colorChangerState) {
        saveStorageAsync(state);
        return resolve(state);
      }

      // Pass the data retrieved from storage down the promise chain.
      resolve(result);
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

chrome.tabs.onActivated.addListener(onTabActivated);
chrome.runtime.onMessage.addListener(onMessage);
chrome.storage.onChanged.addListener(onStorageChanged);
chrome.runtime.onInstalled.addListener(onInstalled);


// initState();
// // console.log('asdf bg');

// saveStorageAsync(state);
getStorageAsync();

console.log('bg');