let colorChanger = null;
var bIsChrome = /Chrome/.test(navigator.userAgent);

function notify(req, sender, res) {
  switch (req.message) {
    case 'reset': console.log("got reset"); break;
    case 'update': {
      // getStorage(null, theState => {
      //   state = theState;
      //   updateContent();
      // })
    }; break;
    default: break;
  }
}

if (bIsChrome) {
  chrome.runtime.onMessage.addListener(notify);
} else {
  browser.runtime.onMessage.addListener(notify);
}

async function run() {
  let w = await wasm_bindgen(chrome.runtime.getURL('pkg/color_changer_bg.wasm'));
  let colorChanger = w.colorchanger_new();
}
run();

// var className = "color-changer-v3";

// var ccStyle = document.createElement('style');
// ccStyle.id = "color-changer-style";

// var observer = new MutationObserver(classListChanged);
// var observerConfig = { attributes: true, attributeFilter: ["class"] };

// var changeColors = false;
// var css = "";
// var state = null;

// function updateCss() {
//   let not = ':not(img):not(img *):not(video):not(video *):not(svg):not(svg *):not(.rc-VideoMiniPlayer *)';
//   css = `
//   .${className} *${not} {
//     color: ${state.fg.hsl} !important;
//     background-color: ${state.bg.hsl} !important;
//     border-color: ${state.bg.lightnessShift} !important;
//   }
//   .${className}${not} *:before,
//   .${className}${not} *:after {
//     color: ${state.fg.hsl} !important;
//     background: ${state.bg.hsl} !important;
//     border-color: ${state.bg.lightnessShift} !important;
//   }
//   .${className}${not} img {
//     visibility: visible !important;
//   }
//   .${className}${not} button {
//     color: ${state.li.hsl} !important;
//   }

//   .${className}${not} input,
//   .${className}${not} input *,
//   .${className}${not} textarea,
//   .${className}${not} textarea *,
//   .${className}${not} pre,
//   .${className}${not} pre *,
//   .${className}${not} code,
//   .${className}${not} code *
//   {
//     background-color: ${state.bg.lightnessShift} !important;
//   }

//   .${className}${not} a,
//   .${className}${not} a *
//   {
//     color: ${state.li.hsl} !important;
//     background-color: ${state.bg.hsl} !important;
//   }
//   .${className}${not} a:hover,
//   .${className}${not} a:hover *
//   {
//     color: ${state.li.hueHovered} !important;
//   }
//   .${className}${not} a:active,
//   .${className}${not} a:active *
//   {
//     color: ${state.li.hueVisited} !important;
//   }
//   .${className}${not} a:visited,
//   .${className}${not} a:visited * {
//     color: ${state.li.hueVisited} !important;
//   }
// `;
// }

// function classListChanged(mutationList, obs) {
//   addClass();
// }

// function addClass() {
//   let html = document.documentElement;
//   if (!html) return;

//   if (!html.classList.contains(className)) {
//     html.classList.add(className);
//   }

//   observer.observe(html, observerConfig);
// }

// function removeClass() {
//   let html = document.documentElement;
//   if (!html) return;

//   html.classList.remove(className);
//   observer.disconnect();
// }

// function updateContent() {
//   if (state.changeColors) {
//     updateCss();

//     ccStyle.textContent = css;

//     if (!document.getElementById("color-changer-style")) {
//       document.head.appendChild(ccStyle);
//     }

//     addClass();
//   } else {
//     removeClass();
//   }
// }

// function getStorage(obj, response) {
//   response = response || (() => { });
//   if (bIsChrome) {
//     chrome.storage.sync.get(obj, response);
//   } else {
//     browser.storage.sync.get(obj, response);
//   }
// }



// function getState() {
//   getStorage(null, theState => {
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



// getState();
