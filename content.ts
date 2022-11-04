import { COLOR_CHANGER_CLASS_NAME, COLOR_CHANGER_STYLE_ID, GET_STATE, UPDATE_CONTENT } from "./constants";
import { Message, State } from "./interfaces";
import { shouldChangeColors } from "./utils";

var ccStyle = document.createElement('style');
ccStyle.id = COLOR_CHANGER_STYLE_ID;

var observer = new MutationObserver(classListChanged);
var observerConfig = { attributes: true, attributeFilter: ["class"] };

var css = "";

function updateCss(state: State) {
  let not = ':not(img):not(img *):not(video):not(video *):not(svg):not(svg *):not(.rc-VideoMiniPlayer *)';
  if (!state) return;

  css = `
  .${COLOR_CHANGER_CLASS_NAME} *${not} {
    color: ${state.fg.hsl} !important;
    background-color: ${state.bg.hsl} !important;
    border-color: ${state.bg.lightnessShift} !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${not} *:before,
  .${COLOR_CHANGER_CLASS_NAME}${not} *:after {
    color: ${state.fg.hsl} !important;
    background: ${state.bg.hsl} !important;
    border-color: ${state.bg.lightnessShift} !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${not} img {
    visibility: visible !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${not} button {
    color: ${state.li.hsl} !important;
  }

  .${COLOR_CHANGER_CLASS_NAME}${not} input,
  .${COLOR_CHANGER_CLASS_NAME}${not} input *,
  .${COLOR_CHANGER_CLASS_NAME}${not} textarea,
  .${COLOR_CHANGER_CLASS_NAME}${not} textarea *,
  .${COLOR_CHANGER_CLASS_NAME}${not} pre,
  .${COLOR_CHANGER_CLASS_NAME}${not} pre *,
  .${COLOR_CHANGER_CLASS_NAME}${not} code,
  .${COLOR_CHANGER_CLASS_NAME}${not} code *
  {
    background-color: ${state.bg.lightnessShift} !important;
  }

  .${COLOR_CHANGER_CLASS_NAME}${not} a,
  .${COLOR_CHANGER_CLASS_NAME}${not} a *
  {
    color: ${state.li.hsl} !important;
    background-color: ${state.bg.hsl} !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${not} a:hover,
  .${COLOR_CHANGER_CLASS_NAME}${not} a:hover *
  {
    color: ${state.li.hueHovered} !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${not} a:active,
  .${COLOR_CHANGER_CLASS_NAME}${not} a:active *
  {
    color: ${state.li.hueVisited} !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${not} a:visited,
  .${COLOR_CHANGER_CLASS_NAME}${not} a:visited * {
    color: ${state.li.hueVisited} !important;
  }
`;
}

function classListChanged(mutationList: MutationRecord[], obs: MutationObserver) {
  addClass();
}

function addClass() {
  let html = document.documentElement;
  if (!html.classList.contains(COLOR_CHANGER_CLASS_NAME)) {
    html.classList.add(COLOR_CHANGER_CLASS_NAME);
  }

  observer.observe(html, observerConfig);
}

function removeClass() {
  let html = document.documentElement;
  html.classList.remove(COLOR_CHANGER_CLASS_NAME);
  observer.disconnect();
}

function updateContent(state: State) {
  if (shouldChangeColors(state)) {
    updateCss(state);

    ccStyle.textContent = css;

    if (!document.getElementById("color-changer-style")) {
      document.head.appendChild(ccStyle);
    }

    addClass();
  } else {
    removeClass();
  }
}

function onMessage(req: Message, sender, res) {
  switch (req.message) {
    case UPDATE_CONTENT: {
      updateContent(req.payload);
    }; break;
    default: break;
  }
}

async function init() {
  let state = await chrome.runtime.sendMessage({ message: GET_STATE });
  updateContent(state);
}

chrome.runtime.onMessage.addListener(onMessage);

init();
