import { COLOR_CHANGER_CLASS_NAME, COLOR_CHANGER_STYLE_ID, GET_STATE, UPDATE_CONTENT } from "./constants";
import { Message, State } from "./interfaces";
import { runtimeSendMessage, shouldChangeColors } from "./utils";

var ccStyle = document.createElement('style');
ccStyle.id = COLOR_CHANGER_STYLE_ID;

var observer = new MutationObserver(classListChanged);
var observerConfig = { attributes: true, attributeFilter: ["class"] };

var css = "";

function updateCss(state: State) {
  if (!state) return;

  let not = ':not(img, video, svg, .rc-VideoMiniPlayer)';

  css = `
  html.${COLOR_CHANGER_CLASS_NAME},
  html.${COLOR_CHANGER_CLASS_NAME} body,
  html.${COLOR_CHANGER_CLASS_NAME} * ${not}
  {
    color: ${state.fg.hsl};
    background-color: ${state.bg.hsl} !important;
    border-color: ${state.bg.lightnessShift} !important;
  }

  html.${COLOR_CHANGER_CLASS_NAME} button,
  html.${COLOR_CHANGER_CLASS_NAME} button *
  {
    color: ${state.li.hsl} !important;
    background-color: transparent !important;
  }
  html.${COLOR_CHANGER_CLASS_NAME} a,
  html.${COLOR_CHANGER_CLASS_NAME} a *
  {
    color: ${state.li.hsl} !important;
    background-color: transparent !important;
  }
  html.${COLOR_CHANGER_CLASS_NAME} a:hover,
  html.${COLOR_CHANGER_CLASS_NAME} a:hover *
  {
    color: ${state.li.hueHovered} !important;
    background-color: transparent !important;
  }
  html.${COLOR_CHANGER_CLASS_NAME} a:active,
  html.${COLOR_CHANGER_CLASS_NAME} a:active *
  {
    color: ${state.li.hueVisited} !important;
    background-color: transparent !important;
  }
  html.${COLOR_CHANGER_CLASS_NAME} a:visited,
  html.${COLOR_CHANGER_CLASS_NAME} a:visited *
  {
    color: ${state.li.hueVisited} !important;
    background-color: transparent !important;
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

function onMessage(message: Message, _sender: any, res: any) {
  switch (message.message) {
    case UPDATE_CONTENT: {
      updateContent(message.payload);
    }; break;
    default: break;
  }
}

async function init() {
  let state = await runtimeSendMessage({ message: GET_STATE });
  updateContent(state);
}

chrome.runtime.onMessage.addListener(onMessage);

init();
