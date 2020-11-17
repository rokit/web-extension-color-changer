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
  let html = document.documentElement;
  if (!html) return;

  html.classList.remove(className);
  observer.disconnect();
}

async function updateContent() {
  if (state.changeColors) {
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

function getStorage(obj, response) {
  if (bIsChrome) {
    chrome.storage.local.get(obj, response);
  } else {
    browser.storage.local.get(obj, response);
  }
}

function notify(req, sender, res) {
  console.log('notify.req', notify.req);
  switch (req.message) {
    case 'update': {
      console.log('content update');
      getStorage(null, theState => {
        state = theState;
        updateContent();
      })
    }; break;
    default: break;
  }
}

if (bIsChrome) {
  chrome.runtime.onMessage.addListener(notify);
} else {
  browser.runtime.onMessage.addListener(notify);
}

// await getState();
// updateContent();
// document.onscroll = updateContent();
