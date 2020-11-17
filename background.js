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

    if (url && url.protocol !== 'chrome:') {
      saveStorage({ activeTabId: tabInfo.tabId });
      watchTab(tabInfo.tabId);
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

// watching tabs may not be necessary if 
// content script gets state and looks for Always
function watchTab(watchedTabId) {
  function tabUpdated(tabId, changeInfo, tab) {
    if (watchedTabId === tabId && tab.status === 'loading') {
      getStorage(['always', 'changeColors'], obj => {
        if (!obj.always && obj.changeColors) {
          console.log('tab was loading and Always not checked');
          saveStorage({changeColors: false})
        }
      })
    }
  }

  if (bIsChrome) {
    chrome.tabs.onUpdated.addListener(tabUpdated)
  } else {
    browser.tabs.onUpdated.addListener(tabUpdated)
  }
}


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

// // cbs = checkboxes
// function onClickAlways(payload) {
//   let index = state.hosts.indexOf(activeTabHostname);

//   if (payload.checked && index === -1) {
//     // if checked and host not present
//     state.hosts.push(activeTabHostname);
//   } else if (!payload.checked && index > -1) {
//     // if not checked and host is present
//     state.hosts.splice(index, 1);
//   }

//   if (payload.checked) {
//     changeColors = true;
//   }

//   saveState(() => {
//     if (payload.checked) {
//       setChangeColors(true);
//     } else {
//       // triggers a state update in content script, which triggers rebuild of context menu
//       setChangeColors(payload.ccChecked);
//     }
//   });
//   return changeColors;
// }

async function notify(req, sender, res) {
  switch (req.message) {
    // case 'changeColors': {
    //   console.log('req.payload', req.payload);
    //   // createContextMenu(req.payload);
    // }; break;
    case 'updateChoseColor': {
      console.log('n updateChosenColor', req.payload);
      getStorage(null, state => {
        switch (state.activeBtn) {
          case "fore": {
            updateChosenColor(state.fg, req.payload);
            saveStorage({
              fg: state.fg,
              lightness: state.fg.lightness,
              changeColors: true,
            });
          } break;
          case "back": {
            updateChosenColor(state.bg, req.payload);
            saveStorage({
              bg: state.bg,
              lightness: state.bg.lightness,
              changeColors: true,
            });
          } break;
          case "link": {
            updateChosenColor(state.li, req.payload);
            saveStorage({
              li: state.li,
              lightness: state.li.lightness,
              changeColors: true
            });
          } break;
          default: break;
        }
      })
      // createContextMenu(req.payload);
    }; break;
    // case 'onClickCc': {
    //   res(onClickCc(req.payload));
    // }; break;
    // case 'onClickAlways': {
    //   res(onClickAlways(req.payload));
    // }; break;
    default: break;
  }
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
    chrome.storage.local.get(obj, response);
  } else {
    browser.storage.local.get(obj, response);
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
      // console.log('activeTabHostname', state.activeTabHostname);
      // console.log('state.changeColors', state.changeColors);
      let index = state.hosts.indexOf(state.activeTabHostname);
      if (!state.changeColors && index > -1) {
        console.log('should set always to false');
        state.hosts.splice(index, 1);
        always = false;
        saveStorage({ always, hosts: state.hosts });
      }

      if (state.activeTabId) {
        sendTabMessage(state.activeTabId, 'update');
      }
    })
  }

  if (ch.always) {
    // todo
  }

  if (ch.fg || ch.bg || ch.li) {
    getStorage(null, state => {
      if (state.activeTabId) {
        sendTabMessage(state.activeTabId, 'update');
      }
    })
  }
}

// get state, initialize defaults, then save state
function initState() {
  // chrome.storage.local.clear();
  chrome.storage.local.get({
    changeColors: false,
    always: false,
    activeTabId: null,
    activeTabHostname: null,
    fg: new ChosenColor(0, 0, 80, 'zero'),
    bg: new ChosenColor(0, 0, 25, 'zero'),
    li: new ChosenColor(68, 80, 80, '2-6'),
    activeBtn: 'fore',
    lightness: 80,
    hosts: [],
    css: '',
  }, (res) => {
    state = { ...res };
    saveStorage({ ...res });
  });
}

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
