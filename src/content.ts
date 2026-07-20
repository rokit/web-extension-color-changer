import * as c from "./constants";
import { type Message, type State } from "./interfaces";
import { shouldChangeColors } from "./utils";

c.SHOULD_CONSOLE_LOG && console.log('cc content - loaded content script');

if (!globalThis.browser) {
  // @ts-ignore
  globalThis.browser = chrome;
}

let ccStyle = document.createElement('style');
ccStyle.id = c.COLOR_CHANGER_STYLE_ID;

let observer = new MutationObserver(classListChanged);
let observerConfig = { attributes: true, attributeFilter: ["class"] };

let css = "";

function updateCss(state: State) {
  if (!state) return;

  let courseraPlayer = ".rc-VideoMiniPlayer *";
  let youtubePlayer = "#player *";
  let youtubeFullscreenPlayer = "#player-container *";
  let youtubeThumbnail = ".ytd-rich-item-renderer *";
  let youtubeSidebar = ".ytd-guide-renderer *";
  let youtubeSearchHeader = ".ytd-masthead *";
  let youtubeShorts = "#shorts-inner-container *"
  let youtubeGrid = ".ytd-grid-renderer *";

  let not = `:not(img, video, svg, ${courseraPlayer}, ${youtubePlayer}, ${youtubeFullscreenPlayer}, ${youtubeGrid}, ${youtubeThumbnail}, ${youtubeSidebar}, ${youtubeSearchHeader}, ${youtubeShorts})`;
  let notId = ":not(#increase-specificity)";

  css = `
  .${c.COLOR_CHANGER_CLASS_NAME},
  .${c.COLOR_CHANGER_CLASS_NAME} body,
  .${c.COLOR_CHANGER_CLASS_NAME} ${not}
  {
    color: ${state.fg.hslString} !important;
    background-color: ${state.bg.hslString} !important;
    border-color: ${state.bg.lightnessShift} !important;
  }

  .${c.COLOR_CHANGER_CLASS_NAME}${notId} input,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} input *,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} textarea,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} textarea *,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} pre,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} pre *,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} code,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} code *
  {
    background-color: ${state.bg.lightnessShift} !important;
  }

  .${c.COLOR_CHANGER_CLASS_NAME}${notId} button,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} button *
  {
    color: ${state.li.hslString} !important;
    background-color: transparent !important;
  }
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} a,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} a *
  {
    color: ${state.li.hslString} !important;
    background-color: transparent !important;
  }
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} a:hover,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} a:hover *
  {
    color: ${state.li.hueHovered} !important;
    background-color: transparent !important;
  }
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} a:active,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} a:active *
  {
    color: ${state.li.hueVisited} !important;
    background-color: transparent !important;
  }
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} a:visited,
  .${c.COLOR_CHANGER_CLASS_NAME}${notId} a:visited *
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
  if (!html.classList.contains(c.COLOR_CHANGER_CLASS_NAME)) {
    html.classList.add(c.COLOR_CHANGER_CLASS_NAME);
  }

  observer.observe(html, observerConfig);
}

function removeClass() {
  let html = document.documentElement;
  html.classList.remove(c.COLOR_CHANGER_CLASS_NAME);
  observer.disconnect();
}

function updateContent(state: State) {
  // c.SHOULD_CONSOLE_LOG && console.log('update content state:', state);
  if (shouldChangeColors(state)) {
    updateCss(state);

    ccStyle.textContent = css;

    if (!document.getElementById(c.COLOR_CHANGER_STYLE_ID)) {
      document.head.appendChild(ccStyle);
    }

    addClass();
  } else {
    removeClass();
  }
}

function onMessage(message: Message, _sender: any, res: any) {
  switch (message.message) {
    case c.UPDATE_CONTENT: {
      updateContent(message.payload);
    }; break;
    default: break;
  }
}

async function init() {
  let state = await browser.runtime.sendMessage({ message: c.GET_STATE });
  updateContent(state);
}

browser.runtime.onMessage.addListener(onMessage);

init();
