var bIsChrome = /Chrome/.test(navigator.userAgent);
var className = "color-changer-2";

var ccStyle = document.createElement('style');
ccStyle.id = "color-changer-style";

var observer = new MutationObserver(classListChanged);
var observerConfig = {attributes: true, attributeFilter: ["class"]};

var changeColors = false;
var css = "";

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
  let html = document.getElementsByTagName("HTML")[0];
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

function readStorage(key) {
  return new Promise((resolve, reject) => {
    if (bIsChrome) {
      chrome.storage.local.get(key, function(result) {
        if (result != undefined) {
            resolve(result);
        } else {
            reject(null);
        }
      });
    } else {
      browser.storage.local.get(key, function(result) {
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
    let res = await readStorage('state');
    state = res.state;
    updateCss();

    ccStyle.textContent = css;

    if (!document.getElementById("color-changer-style")) {
      document.head.appendChild(ccStyle);
    }

    addClass();
    // if (state.url_index > -1 && !state.urls[state.url_index].always) {
    //   removeClass();
    // }
  } else {
    removeClass();
  }
}

async function notify(req, sender, res){
  switch(req.message) {
    case 'toggleChangeColors': {
      changeColors = !changeColors;
      res(changeColors);
      updateContent();
    }; break;
    case 'getChangeColors': {
      res(changeColors);
    } break;
    case 'updateContent': {
      updateContent();
    } break;
    case 'updateContentViaSwatch': {
      changeColors = true;
      updateContent();
    } break;
    default: break;
  }
  //   state = msg.new_state;
  //   isCcBtnOn = state.cc_toggle;
  //   ccStyle.textContent = state.css;

  //   if (!document.getElementById("color-changer-style")) {
  //     document.head.appendChild(ccStyle);
  //   }

  //   if ((state.url_index > -1 && state.urls[state.url_index].always) || isCcBtnOn) {
  //     addClass();
  //   } else {
  //     removeClass();
  //   }
  //   // if (state.url_index > -1 && !state.urls[state.url_index].always) {
  //   //   removeClass();
  //   // }
  // } else if (msg.getCcBtnState) {
  //   sendResponse(isCcBtnOn);
  // } else if (msg.setCc) {
  //   isCcBtnOn = msg.setCc;
  // }
}

// function sendMessage(message, value) {
//   if (bIsChrome) {
//     chrome.runtime.sendMessage({message, value});
//   } else {
//     browser.runtime.sendMessage({message, value});
//   }
// }

// function get_state() {
//   if (bIsChrome) {
//     chrome.runtime.sendMessage({content_request_state: true});
//   } else {
//     browser.runtime.sendMessage({content_request_state: true});
//   }
// }

if (bIsChrome) {
  chrome.runtime.onMessage.addListener(notify);
} else {
  browser.runtime.onMessage.addListener(notify);
}

// get_state();

document.onscroll = addClass();