var bIsChrome = /Chrome/.test(navigator.userAgent);
var className = "color-changer-2";
var contextMenuCreated = false;

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
  color.chosenId = swatch.id;
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

function createContextMenu() {
  getStorage(null, state => {
    let ctxColorChanger = {
      id: "changeColors",
      title: "Change Colors",
      contexts: ["all"],
      type: "checkbox",
      checked: state.changeColors,
      onclick: evt => saveStorage({ changeColors: evt.checked }),
    };

    let ctxAlways = {
      id: "always",
      title: "Always",
      contexts: ["all"],
      type: "checkbox",
      checked: state.always,
      onclick: evt => saveStorage({ always: evt.checked }),
    };

    if (bIsChrome) {
      chrome.contextMenus.removeAll();
      chrome.contextMenus.create(ctxColorChanger);
      chrome.contextMenus.create(ctxAlways);
    } else {
      browser.contextMenus.removeAll();
      browser.contextMenus.create(ctxColorChanger);
      browser.contextMenus.create(ctxAlways);
    }
    contextMenuCreated = true;
  });
}

function updateContextMenu(changeColors, always) {
  if (!contextMenuCreated) return;
  if (bIsChrome) {
    chrome.contextMenus.update('changeColors', { checked: changeColors });
    chrome.contextMenus.update('always', { checked: always });
  } else {
    browser.contextMenus.update('changeColors', { checked: changeColors });
    browser.contextMenus.update('always', { checked: always });
  }
}

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

    if (url && url.protocol !== 'chrome:' && url.protocol !== 'about:') {
      saveStorage({ activeTabHostname, activeTabId: tabInfo.tabId });
      watchTab(tabInfo.tabId);
      chrome.tabs.executeScript(tabInfo.tabId, {
        code: `document.documentElement.classList.contains('${className}')`
      }, (results) => {
        saveStorage({ changeColors: results[0] });
      });
    } else {
      saveStorage({ activeTabHostname: null, activeTabId: null });
    }
  });
}


// watching tabs may not be necessary if 
// content script gets state and looks for Always
function tabUpdated(tabId, changeInfo, tab) {
  getStorage(null, state => {
    console.log('tabUpdated');
    if (tabId === state.activeTabId && tab.status === 'loading') {
      checkActiveTabHostnameInHosts();
      // getStorage(['always', 'changeColors'], obj => {
      //   if (!obj.always && obj.changeColors) {
      //     console.log('tab was loading and Always not checked');
      //     saveStorage({changeColors: false})
      //   }
      // })
    }
  });
}

function watchTab() {
  if (bIsChrome) {
    chrome.tabs.onUpdated.removeListener(tabUpdated);
    chrome.tabs.onUpdated.addListener(tabUpdated);
  } else {
    chrome.tabs.onUpdated.removeListener(tabUpdated);
    browser.tabs.onUpdated.addListener(tabUpdated);
  }
}

function checkActiveTabHostnameInHosts() {
  getStorage(null, state => {
    let index = state.hosts.indexOf(state.activeTabHostname);

    console.log('state.activeTabHostname', state.activeTabHostname);
    console.log('index', index);

    if (index > -1) {
      saveStorage({ changeColors: true, always: true }, () => {
        sendTabMessage(state.activeTabId, 'update');
      });
    } else {
      saveStorage({ changeColors: false, always: false }, () => {
        sendTabMessage(state.activeTabId, 'update');
      });
    }
  })
}
// ch = changes
function onStorageChanged(ch, areaName) {
  console.log('---- storage changed', ch);
  getStorage(null, state => {
    // console.log('state', state);
    // console.log('ch', ch);

    // if state is empty, return
    // state can be empty when clearing storage
    if (Object.keys(state).length === 0 && state.constructor === Object) {
      return;
    }
    if (ch.activeTabHostname) {
      // check if hostname is in hosts
      checkActiveTabHostnameInHosts();
    }

    if (ch.changeColors) {
      updateContextMenu(state.changeColors, state.always);
      if (!state.changeColors) {
        saveStorage({ always: false });
      }

      if (state.activeTabId) {
        sendTabMessage(state.activeTabId, 'update');
      }
    }

    if (ch.always) {
      updateContextMenu(state.changeColors, state.always);
      let index = state.hosts.indexOf(state.activeTabHostname);
      if (state.always && index === -1) {
        state.hosts.push(state.activeTabHostname);
        saveStorage({ changeColors: true, hosts: [...state.hosts] });
      } else if (!state.always && index > -1) {
        state.hosts.splice(index, 1);
        saveStorage({ hosts: [...state.hosts] });
      }
      // sendTabMessage(state.activeTabId, 'update');
    }

    if (ch.fg || ch.bg || ch.li) {
      if (state.activeTabId) {
        sendTabMessage(state.activeTabId, 'update');
      }
    }
  });
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

function onUpdateStrings() {
  getStorage(null, state => {
    switch (state.activeBtn) {
      case "fore": {
        createStrings(state.fg);
        saveStorage({
          fg: state.fg,
          changeColors: true,
        });
      } break;
      case "back": {
        createStrings(state.bg);
        saveStorage({
          bg: state.bg,
          changeColors: true,
        });
      } break;
      case "link": {
        createStrings(state.li);
        saveStorage({
          li: state.li,
          changeColors: true
        });
      } break;
      default: break;
    }
  });
}

// saves defaults
function onResetState() {
  // don't reset:
  // colorChanger
  // activeTabId
  // activeTabHostname

  const stateToReset = {
    always,
    hosts,
    fg,
    bg,
    li,
    activeBtn,
    lightness,
  };

  saveStorage(stateToReset);
}

function onUpdateLightness(lightness) {
  getStorage(null, state => {
    switch (state.activeBtn) {
      case 'fore': {
        state.fg.lightness = lightness;
        createStrings(state.fg);
        saveStorage({ lightness, fg: state.fg });
      } break;
      case 'back': {
        state.bg.lightness = lightness;
        createStrings(state.bg);
        saveStorage({ lightness, bg: state.bg });
      } break;
      case 'link': {
        state.li.lightness = lightness;
        createStrings(state.li);
        saveStorage({ lightness, li: state.li });
      } break;
      default: break;
    }
  });
}

// gets or initializes a property, then saves
async function initState() {
  let stateToGetOrInitialize = {
    changeColors,
    always,
    hosts,
    activeTabId,
    activeTabHostname,
    fg,
    bg,
    li,
    activeBtn,
    lightness,
  };

  getStorage(stateToGetOrInitialize, state => {
    saveStorage(state, createContextMenu);
  });
}

function getStorage(obj, response) {
  response = response || (() => { });
  if (bIsChrome) {
    chrome.storage.local.get(obj, response);
  } else {
    browser.storage.local.get(obj, response);
  }
}

function saveStorage(obj, response) {
  response = response || (() => { });
  console.log('response', response);
  if (bIsChrome) {
    chrome.storage.local.set({ ...obj }, response);
  } else {
    browser.storage.local.set({ ...obj }, response);
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

async function notify(req, sender, res) {
  switch (req.message) {
    case 'updateChosenColor': onUpdateChosenColor(req.payload); break;
    case 'updateStrings': onUpdateStrings(); break;
    case 'resetState': onResetState(); break;
    case 'updateLightness': onUpdateLightness(req.payload); break;
    default: break;
  }
}

if (bIsChrome) {
  chrome.tabs.onActivated.addListener(tabActivated);
  chrome.runtime.onMessage.addListener(notify);
  chrome.storage.onChanged.addListener(onStorageChanged);
} else {
  browser.tabs.onActivated.addListener(tabActivated);
  browser.runtime.onMessage.addListener(notify);
  browser.storage.onChanged.addListener(onStorageChanged);
}

chrome.storage.local.clear(); // will also trigger a storage.onChanged event
initState();
