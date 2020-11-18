var bIsChrome = /Chrome/.test(navigator.userAgent);
var className = "color-changer-2";

function ChosenColor(hue, saturation, lightness, chosenId) {
  this.hue = hue;
  this.saturation = saturation;
  this.lightness = lightness;
  this.chosenId = chosenId;
  createStrings(this);
}

function updateChosenColor(color, swatch) {
  color.hue = swatch.hue;
  color.saturation = swatch.saturation;
  color.lightness = swatch.lightness;
  color.chosenId = swatch.chosenId;
  createStrings(color);
}

function createStrings(color) {
  color.hsl = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
  if (color.lightness >= 50) {
    color.lightnessShift = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness - 10}%)`;
  } else {
    color.lightnessShift = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness + 10}%)`;
  }
  color.hueHovered = `hsl(${color.hue + 40 % 360}, ${color.saturation + 20}%, ${color.lightness}%)`;
  color.hueVisited = `hsl(${color.hue - 40 % 360}, ${color.saturation + 20}%, ${color.lightness}%)`;
  color.alpha = `hsla(${color.hue}, ${color.saturation}%, ${color.lightness}%, 0.5)`;
}

// defaults
const changeColors = false;
const always = false;
const activeTabId = null;
const activeTabHostname = null;
const fg = new ChosenColor(0, 0, 80, 'zero');
const bg = new ChosenColor(0, 0, 25, 'zero');
const li = new ChosenColor(68, 80, 80, '2-6');
const activeBtn = 'fore';
const lightness = 80;
const hosts = [];

// async function setChangeColors(value) {
//   if (activeTabId) {
//     if (bIsChrome) {
//       chrome.tabs.sendMessage(activeTabId, { message: 'setChangeColors', value });
//     } else {
//       browser.tabs.sendMessage(activeTabId, { message: 'setChangeColors', value });
//     }
//   }
// }

// async function createContextMenu() {
//   let state = (await getStorageValue('state')).state;
//   let activeTabHostname = (await getStorageValue('activeTabHostname')).activeTabHostname;
//   let index = state.hosts.indexOf(activeTabHostname);
//   let always = false;
//   if (index > -1) {
//     always = true;
//   }

//   let ctxColorChanger = {
//     id: "changeColors",
//     title: "Change Colors",
//     contexts: ["all"],
//     type: "checkbox",
//     checked: changeColors,
//     onclick: evt => {
//       onClickCc(evt.checked);
//     },
//   };

//   let ctxAlways = {
//     id: "always",
//     title: "Always",
//     contexts: ["all"],
//     type: "checkbox",
//     checked: always,
//     onclick: evt => {
//       onClickAlways({checked: evt.checked, ccChecked: changeColors});
//     },
//   };

//   if (bIsChrome) {
//     chrome.contextMenus.removeAll();
//     chrome.contextMenus.create(ctxColorChanger);
//     chrome.contextMenus.create(ctxAlways);
//   } else {
//     browser.contextMenus.removeAll();
//     browser.contextMenus.create(ctxColorChanger);
//     browser.contextMenus.create(ctxAlways);
//   }
// }

// // chrome.tabs.sendMessage(tabInfo.tabId, { message: 'updateContent' });
// // browser.tabs.sendMessage(tabInfo.tabId, { message: 'updateContent' });

// on tab activation get tabid and hostname
function tabActivated(tabInfo) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    let url = null;
    let activeTabHostname = "";
    try {
      url = new URL(tabs[0].url);
      activeTabHostname = url.hostname;
    } catch {
      activeTabHostname = "";
    }
    saveStorage({ activeTabHostname });

    if (url && url.protocol !== 'chrome:' && url.protocol !== 'about:') {
      saveStorage({ activeTabId: tabInfo.tabId });
      chrome.tabs.executeScript(tabInfo.tabId, {
        code: `document.documentElement.classList.contains('${className}')`
      }, (results) => {
        saveStorage({ changeColors: results[0] });
      });
    } else {
      saveStorage({ changeColors: false, activeTabId: null });
    }
  });
}

// // watching tabs may not be necessary if 
// // content script gets state and looks for Always
// function watchTab(watchedTabId) {
//   function tabUpdated(tabId, changeInfo, tab) {
//     if (watchedTabId === tabId && tab.status === 'loading') {
//       getStorage(['always', 'changeColors'], obj => {
//         if (!obj.always && obj.changeColors) {
//           console.log('tab was loading and Always not checked');
//           saveStorage({changeColors: false})
//         }
//       })
//     }
//   }

//   if (bIsChrome) {
//     chrome.tabs.onUpdated.addListener(tabUpdated)
//   } else {
//     browser.tabs.onUpdated.addListener(tabUpdated)
//   }
// }


async function onChangeColors(checked) {
  let hosts = (await getStorageValue('hosts')).hosts;
  let activeTabHostname = (await getStorageValue('activeTabHostname')).activeTabHostname;
  let index = hosts.indexOf(activeTabHostname);
  let always = false;
  if (index > -1) {
    always = true;
  }

  if (!checked) {
    // if we're unchecking Change Colors, remove the hostname if it exists
    if (always) {
      // state.hosts.splice(index, 1);
      always = false;
    }
  }

  saveStorage({ always });
}

function saveStorage(obj, response) {
  if (bIsChrome) {
    chrome.storage.local.set({ ...obj }, response);
  } else {
    browser.storage.local.set({ ...obj }, response);
  }
}

function getStorage(obj, response) {
  if (bIsChrome) {
    chrome.storage.local.get({ ...obj }, response);
  } else {
    browser.storage.local.get({ ...obj }, response);
  }
}

function sendTabMessage(activeTabId, message, payload, response) {
  if (!activeTabId) return;
  if (bIsChrome) {
    chrome.tabs.sendMessage(activeTabId, { message, payload }, response);
  } else {
    browser.tabs.sendMessage(activeTabId, { message, payload }, response);
  }
}

// ch = changes
function onStorageChanged(ch, areaName) {
  console.log('storage changed');
  console.log('ch', ch);

  if (ch.activeTabHostname) {
    // check if hostname is in hosts
    getStorage(null, state => {
      let index = state.hosts.indexOf(state.activeTabHostname);
      let always = false;
      if (index > -1) {
        always = true;
      }
      saveStorage({ always });
    })
  }

  if (ch.changeColors) {
    getStorage(null, state => {
      if (!state.changeColors) {
        saveStorage({ always: false });
      }

      if (state.activeTabId) {
        sendTabMessage(state.activeTabId, 'update');
      }
    })
  }

  if (ch.always) {
    getStorage(null, state => {
      console.log('state', state);
      let index = state.hosts.indexOf(state.activeTabHostname);
      if (state.always && index === -1) {
        state.hosts.push(state.activeTabHostname);
        saveStorage({ changeColors: true, hosts: [...state.hosts] });
      } else if (!state.always && index > -1) {
        state.hosts.splice(index, 1);
        saveStorage({ hosts: [...state.hosts] });
      }
    })
  }

  if (ch.fg || ch.bg || ch.li) {
    getStorage(null, state => {
      if (state.activeTabId) {
        sendTabMessage(state.activeTabId, 'update');
      }
    })
  }
}

function onUpdateChosenColor(payload) {
  getStorage(null, state => {
    switch (state.activeBtn) {
      case "fore": {
        updateChosenColor(state.fg, payload);
        saveStorage({
          fg: state.fg,
          lightness: state.fg.lightness,
          changeColors: true,
        });
      } break;
      case "back": {
        updateChosenColor(state.bg, payload);
        saveStorage({
          bg: state.bg,
          lightness: state.bg.lightness,
          changeColors: true,
        });
      } break;
      case "link": {
        updateChosenColor(state.li, payload);
        saveStorage({
          li: state.li,
          lightness: state.li.lightness,
          changeColors: true
        });
      } break;
      default: break;
    }
  });
}

function onResetState() {
  // don't reset:
  // colorChanger
  // activeTabId
  // activeTabHostname

  const stateToReset = {
    always,
    fg,
    bg,
    li,
    activeBtn,
    lightness,
  };

  // reset hosts before anything else
  // because onChangeHandler depends on it
  saveStorage({ hosts });
  saveStorage({ ...stateToReset });
}

async function notify(req, sender, res) {
  switch (req.message) {
    case 'updateChoseColor': onUpdateChosenColor(req.payload); break;
    case 'resetState': onResetState(); break;
    default: break;
  }
}

// if a state property isn't present,
// this will initialize it with the proper value.
// we then save these values back to state
function initState() {
  let stateToGetOrInitialize = {
    changeColors,
    always,
    activeTabId,
    activeTabHostname,
    fg,
    bg,
    li,
    activeBtn,
    lightness,
  };
  getStorage({ hosts });
  getStorage({ stateToGetOrInitialize });
}

chrome.storage.local.clear();
initState();

if (bIsChrome) {
  chrome.tabs.onActivated.addListener(tabActivated);
  chrome.runtime.onMessage.addListener(notify);
  chrome.storage.onChanged.addListener(onStorageChanged);
} else {
  browser.tabs.onActivated.addListener(tabActivated);
  browser.runtime.onMessage.addListener(notify);
  browser.storage.onChanged.addListener(onStorageChanged);
}
