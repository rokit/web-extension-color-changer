var bIsChrome = /Chrome/.test(navigator.userAgent);
var className = "color-changer-2";

var ccStyle = document.createElement('style');
ccStyle.id = "color-changer-style";

var observer = new MutationObserver(classListChanged);
var observerConfig = { attributes: true, attributeFilter: ["class"] };

var changeColors = false;
var css = "";
var state = null;

function updateCss() {
  css = `
  .${className} {
    background-color: ${state.bg.hsl} !important;
  }
  .${className} * {
    color: ${state.fg.hsl} !important;
    background-color: ${state.bg.hsl} !important;
    border-color: ${state.bg.lightnessShift} !important;
  }
  .${className} *:before, .${className} *:after {
    color: ${state.fg.hsl} !important;
    background: ${state.bg.hsl} !important;
    border-color: ${state.bg.lightnessShift} !important;
  }
  .${className} img {
    visibility: visible !important;
  }
  .${className} button {
    color: ${state.li.hsl} !important;
  }

  .${className} input, .${className} input *,
  .${className} textarea, .${className} textarea *,
  .${className} pre, .${className} pre *,
  .${className} code, .${className} code * {
    background-color: ${state.bg.lightnessShift} !important;
  }

  .${className} a, .${className} a * {
    color: ${state.li.hsl} !important;
    background-color: ${state.bg.hsl} !important;
  }
  .${className} a:hover, .${className} a:hover * {
    color: ${state.li.hueHovered} !important;
  }
  .${className} a:active, .${className} a:active * {
    color: ${state.li.hueVisited} !important;
  }
  .${className} a:visited, .${className} a:visited * {
    color: ${state.li.hueVisited} !important;
  }
`;
}

function classListChanged(mutationList, obs) {
  addClass();
}

function addClass() {
  let html = document.documentElement;
  if (!html) return;

  if (!html.classList.contains(className)) {
    html.classList.add(className);
  }

  observer.observe(html, observerConfig);
}

function removeClass() {
  let html = document.getElementsByTagName("HTML")[0];
  if (!html) return;

  html.classList.remove(className);
  observer.disconnect();
}

function getStorageValue(key) {
  return new Promise((resolve, reject) => {
    if (bIsChrome) {
      chrome.storage.local.get(key, function (result) {
        if (result != undefined) {
          resolve(result);
        } else {
          reject(null);
        }
      });
    } else {
      browser.storage.local.get(key, function (result) {
        if (result != undefined) {
          resolve(result);
        } else {
          reject(null);
        }
      });
    }
  });
}

async function updateContent() {
  if (changeColors) {
    state = (await getStorageValue('state')).state;
    updateCss();

    ccStyle.textContent = css;

    if (!document.getElementById("color-changer-style")) {
      document.head.appendChild(ccStyle);
    }

    addClass();
  } else {
    removeClass();
  }
}

async function notify(req, sender, res) {
  switch (req.message) {
    case 'setChangeColors': {
      changeColors = req.value;
      getState();
      updateContent();
      sendMessage('contextMenu', {changeColors, state});
    }; break;
    case 'getChangeColors': {
      res(changeColors);
    } break;
    case 'updateContent': {
      updateContent();
    } break;
    default: break;
  }
}

async function getState() {
  state = (await getStorageValue('state')).state;
  let thisLocationHostname = new URL(window.location.href).hostname;
  let index = state.hosts.indexOf(thisLocationHostname);

  if (index > -1) {
    // if host is in list
    changeColors = true;
    updateContent();
  }
  sendMessage('contextMenu', {changeColors, state});
}

function sendMessage(message, payload) {
  if (bIsChrome) {
    chrome.runtime.sendMessage({ message, payload });
  } else {
    browser.runtime.sendMessage({ message, payload });
  }
}

if (bIsChrome) {
  chrome.runtime.onMessage.addListener(notify);
} else {
  browser.runtime.onMessage.addListener(notify);
}

getState();

document.onscroll = updateContent();