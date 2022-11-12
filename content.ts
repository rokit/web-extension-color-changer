import { COLOR_CHANGER_CLASS_NAME, COLOR_CHANGER_STYLE_ID, GET_STATE, UPDATE_CONTENT } from "./constants";
import { Message, State } from "./interfaces";
import { runtimeSendMessage, shouldChangeColors } from "./utils";

let ccStyle = document.createElement('style');
ccStyle.id = COLOR_CHANGER_STYLE_ID;

let observer = new MutationObserver(classListChanged);
let observerConfig = { attributes: true, attributeFilter: ["class"] };

let css = "";

function updateCss(state: State) {
  if (!state) return;

  let courseraVideos = " #vjs_video_1 *";
  let youtubePlayer = "#player *";
  let youtubeSidebar = ".ytd-guide-renderer *";
  let youtubeSearchHeader = ".ytd-masthead *";
  let youtubeShorts = "#shorts-inner-container *"
  let not = `:not(img, video, svg, ${courseraVideos}, ${youtubePlayer}, ${youtubeSidebar}, ${youtubeSearchHeader}, ${youtubeShorts})`;
  let notId = ":not(#increase-specificity)";

  css = `
  .${COLOR_CHANGER_CLASS_NAME},
  .${COLOR_CHANGER_CLASS_NAME} body,
  .${COLOR_CHANGER_CLASS_NAME} ${not}
  {
    color: ${state.fg.hsl} !important;
    background-color: ${state.bg.hsl} !important;
    border-color: ${state.bg.lightnessShift} !important;
  }

  .${COLOR_CHANGER_CLASS_NAME}${notId} input,
  .${COLOR_CHANGER_CLASS_NAME}${notId} input *,
  .${COLOR_CHANGER_CLASS_NAME}${notId} textarea,
  .${COLOR_CHANGER_CLASS_NAME}${notId} textarea *,
  .${COLOR_CHANGER_CLASS_NAME}${notId} pre,
  .${COLOR_CHANGER_CLASS_NAME}${notId} pre *,
  .${COLOR_CHANGER_CLASS_NAME}${notId} code,
  .${COLOR_CHANGER_CLASS_NAME}${notId} code *
  {
    background-color: ${state.bg.lightnessShift} !important;
  }

  .${COLOR_CHANGER_CLASS_NAME}${notId} button,
  .${COLOR_CHANGER_CLASS_NAME}${notId} button *
  {
    color: ${state.li.hsl} !important;
    background-color: transparent !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${notId} a,
  .${COLOR_CHANGER_CLASS_NAME}${notId} a *
  {
    color: ${state.li.hsl} !important;
    background-color: transparent !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${notId} a:hover,
  .${COLOR_CHANGER_CLASS_NAME}${notId} a:hover *
  {
    color: ${state.li.hueHovered} !important;
    background-color: transparent !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${notId} a:active,
  .${COLOR_CHANGER_CLASS_NAME}${notId} a:active *
  {
    color: ${state.li.hueVisited} !important;
    background-color: transparent !important;
  }
  .${COLOR_CHANGER_CLASS_NAME}${notId} a:visited,
  .${COLOR_CHANGER_CLASS_NAME}${notId} a:visited *
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
