import { State } from "./interfaces";

// var bIsChrome = /Chrome/.test(navigator.userAgent);
var className = "color-changer-v4";

var ccStyle = document.createElement('style');
ccStyle.id = "color-changer-style";

var observer = new MutationObserver(classListChanged);
var observerConfig = { attributes: true, attributeFilter: ["class"] };

// var changeColors = false;
var css = "";
var state: State | null = null;

function updateCss() {
  let not = ':not(img):not(img *):not(video):not(video *):not(svg):not(svg *):not(.rc-VideoMiniPlayer *)';
  if (!state) return;

  css = `
  .${className} *${not} {
    color: ${state.fg.hsl} !important;
    background-color: ${state.bg.hsl} !important;
    border-color: ${state.bg.lightnessShift} !important;
  }
  .${className}${not} *:before,
  .${className}${not} *:after {
    color: ${state.fg.hsl} !important;
    background: ${state.bg.hsl} !important;
    border-color: ${state.bg.lightnessShift} !important;
  }
  .${className}${not} img {
    visibility: visible !important;
  }
  .${className}${not} button {
    color: ${state.li.hsl} !important;
  }

  .${className}${not} input,
  .${className}${not} input *,
  .${className}${not} textarea,
  .${className}${not} textarea *,
  .${className}${not} pre,
  .${className}${not} pre *,
  .${className}${not} code,
  .${className}${not} code *
  {
    background-color: ${state.bg.lightnessShift} !important;
  }

  .${className}${not} a,
  .${className}${not} a *
  {
    color: ${state.li.hsl} !important;
    background-color: ${state.bg.hsl} !important;
  }
  .${className}${not} a:hover,
  .${className}${not} a:hover *
  {
    color: ${state.li.hueHovered} !important;
  }
  .${className}${not} a:active,
  .${className}${not} a:active *
  {
    color: ${state.li.hueVisited} !important;
  }
  .${className}${not} a:visited,
  .${className}${not} a:visited * {
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

function updateContent() {
  if (state?.changeColors) {
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

// function getTheStorage(obj, response) {
//   response = response || (() => { });
//   if (bIsChrome) {
//     chrome.storage.sync.get(obj, response);
//   } else {
//     browser.storage.sync.get(obj, response);
//   }
// }

function onMessage(req, sender, res) {
  console.log('req', req);
  switch (req.message) {
    case 'update': {
      state = req.payload;
      updateContent();
    }; break;
    default: break;
  }
}

// function getState() {
//   getTheStorage(null, theState => {
//     state = theState;
//     let url = null;
//     let activeTabHostname = null;
//     try {
//       url = new URL(document.location.href);
//       activeTabHostname = url.hostname;
//     } catch {
//       activeTabHostname = null;
//     }
//     saveStorage({ activeTabHostname });
//     let index = state.hosts.indexOf(activeTabHostname);

//     if (index > -1) {
//       state.changeColors = true;
//       state.always = true;
//       saveStorage({ changeColors: true, always: true });
//       updateContent();
//     } else {
//       state.changeColors = false;
//       state.always = false;
//       saveStorage({ changeColors: false, always: false });
//     }
//   })
// }

// function saveStorage(obj, response) {
//   response = response || (() => { });
//   if (bIsChrome) {
//     chrome.storage.sync.set({ ...obj }, response);
//   } else {
//     browser.storage.sync.set({ ...obj }, response);
//   }
// }

chrome.runtime.onMessage.addListener(onMessage);

// getState();

console.log('content sc');