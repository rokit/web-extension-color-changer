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

  let ctxColorChanger = {
    id: "changeColors",
    title: "Change Colors",
    contexts: ["all"],
    type: "checkbox",
    checked: changeColors,
    onclick: evt => {
      onClickCc(evt.checked);
    },
  };

  let ctxAlways = {
    id: "always",
    title: "Always",
    contexts: ["all"],
    type: "checkbox",
    checked: always,
    onclick: evt => {
      onClickAlways({checked: evt.checked, ccChecked: changeColors});
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

function onClickCc(checked) {
  let index = state.hosts.indexOf(currentTabHostname);
  let always = false;
  if (index > -1) {
    always = true;
  }

  if (!checked) {
    // if we're unchecking Change Colors, remove the hostname if it exists
    if (always) {
      state.hosts.splice(index, 1);
      always = false;
    }
  }
  saveState(() => setChangeColors(checked));
  return always;
}

// cbs = checkboxes
function onClickAlways(cbs) {
  let index = state.hosts.indexOf(currentTabHostname);

  if (cbs.checked && index === -1) {
    // if checked and host not present
    state.hosts.push(currentTabHostname);
  } else if (!cbs.checked && index > -1) {
    // if not checked and host is present
    state.hosts.splice(index, 1);
  }

  if (cbs.checked) {
    changeColors = true;
  }

  saveState(() => {
    if (cbs.checked) {
      setChangeColors(true);
    } else {
      // triggers a state update in content script, which triggers rebuild of context menu
      setChangeColors(cbs.ccChecked);
    }
  });
  return changeColors;
}

async function notify(req, sender, res) {
  switch (req.message) {
    case 'contextMenu': {
      changeColors = req.payload.changeColors;
      state = req.payload.state;
      createContextMenu();
    }; break;
    case 'onClickCc': {
      res(onClickCc(req.payload.checked));
    }; break;
    case 'onClickAlways': {
      res(onClickAlways(req.payload));
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