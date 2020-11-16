var bIsChrome = /Chrome/.test(navigator.userAgent);
var state = null;
var activeTabId = null;
var changeColors = false;
var currentTabHostname = null;

async function setChangeColors(value) {
  if (activeTabId) {
    if (bIsChrome) {
      chrome.tabs.sendMessage(activeTabId, { message: 'setChangeColors', value });
    } else {
      browser.tabs.sendMessage(activeTabId, { message: 'setChangeColors', value });
    }
  }
}

function saveState(response) {
  if (bIsChrome) {
    chrome.storage.local.set({ state }, response);
  } else {
    browser.storage.local.set({ state }, response);
  }
}

function createContextMenu() {
  let index = state.hosts.indexOf(currentTabHostname);
  let always = false;
  if (index > -1) {
    always = true;
  }
  console.log('always', always);
  let ctxColorChanger = {
    id: "changeColors",
    title: "Change Colors",
    contexts: ["all"],
    type: "checkbox",
    checked: changeColors,
    onclick: evt => {
      if (!evt.checked) {
        // if we're unchecking Change Colors, remove the hostname if it exists
        if (always) {
          state.hosts.splice(index, 1);
        }
      }
      saveState(() => setChangeColors(evt.checked));
    },
  };

  let ctxAlways = {
    id: "always",
    title: "Always",
    contexts: ["all"],
    type: "checkbox",
    checked: always,
    onclick: evt => {
      if (evt.checked && index === -1) {
        // if checked and host not present
        state.hosts.push(currentTabHostname);
      } else if (!evt.checked && index > -1) {
        // if not checked and host is present
        state.hosts.splice(index, 1);
      }

      saveState(() => {
        if (evt.checked) {
          changeColors = true;
          setChangeColors(true);
        } else {
          setChangeColors(changeColors);
        }
      });
    },
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
}

async function tabActivated(tabInfo) {
  activeTabId = tabInfo.tabId;
  if (bIsChrome) {
    chrome.storage.local.set({ tabInfo });
    chrome.tabs.sendMessage(tabInfo.tabId, { message: 'updateContent' });
  } else {
    browser.storage.local.set({ tabInfo });
    browser.tabs.sendMessage(tabInfo.tabId, { message: 'updateContent' });
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    try {
      currentTabHostname = new URL(tabs[0].url).hostname;
    } catch {
      currentTabHostname = "";
    }

    if (bIsChrome) {
      chrome.storage.local.set({ currentTabHostname });
    } else {
      browser.storage.local.set({ currentTabHostname });
    }
  });
}

async function notify(req, sender, res) {
  switch (req.message) {
    case 'contextMenu': {
      changeColors = req.payload.changeColors;
      state = req.payload.state;
      createContextMenu();
    }; break;
    default: break;
  }
}

if (bIsChrome) {
  chrome.tabs.onActivated.addListener(tabActivated);
  chrome.runtime.onMessage.addListener(notify);
} else {
  browser.tabs.onActivated.addListener(tabActivated);
  browser.runtime.onMessage.addListener(notify);
}