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

function createContextMenu() {
  let ctxColorChanger = {
    id: "changeColors",
    title: "Change Colors",
    contexts: ["all"],
    type: "checkbox",
    checked: changeColors,
    onclick: async (evt) => {
      setChangeColors(evt.checked);
    },
  };

  if (bIsChrome) {
    chrome.contextMenus.removeAll();
    chrome.contextMenus.create(ctxColorChanger);
  } else {
    browser.contextMenus.removeAll();
    browser.contextMenus.create(ctxColorChanger);
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
      changeColors = req.value;
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