var bIsChrome = /Chrome/.test(navigator.userAgent);

async function tabActivated(tabInfo) {
  if (bIsChrome) {
    chrome.storage.local.set({ tabInfo });
    chrome.tabs.sendMessage(tabInfo.tabId, { message: 'updateContent' });
  } else {
    browser.storage.local.set({ tabInfo });
    browser.tabs.sendMessage(tabInfo.tabId, { message: 'updateContent' });
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    let currentTabHostname = new URL(tabs[0].url).hostname;
    if (bIsChrome) {
      chrome.storage.local.set({ currentTabHostname });
    } else {
      browser.storage.local.set({ currentTabHostname });
    }
  });
}

if (bIsChrome) {
  chrome.tabs.onActivated.addListener(tabActivated);
} else {
  browser.tabs.onActivated.addListener(tabActivated);
}