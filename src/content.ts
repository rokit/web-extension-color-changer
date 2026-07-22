import * as c from "./constants";
import { type Message, type SyncState } from "./types";
import { isSavedHost } from "./utils";

c.LOG && console.log('cc content - loaded content script');

if (!globalThis.browser) {
  // @ts-ignore
  globalThis.browser = chrome;
}

let ccStyle = document.createElement('style');
ccStyle.id = c.COLOR_CHANGER_STYLE_ID;

let observer = new MutationObserver(classListChanged);
let observerConfig = { attributes: true, attributeFilter: ["class"] };

let css = "";

async function updateCss(state: SyncState) {
  let is = ":not(#increase-specificity-yo)";

  css = `
  .${c.COLOR_CHANGER_CLASS_NAME},
  .${c.COLOR_CHANGER_CLASS_NAME} *
  {
    color: ${state.text.hslString} !important;
    background: transparent !important;
    border-color: ${state.background.lightnessShift} !important;
  }

  .${c.COLOR_CHANGER_CLASS_NAME}${is},
  .${c.COLOR_CHANGER_CLASS_NAME}${is} body,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} nav,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} ul,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} header,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} table,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} footer
  {
    background-color: ${state.background.hslString} !important;
  }

  .${c.COLOR_CHANGER_CLASS_NAME}${is} input,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} input *,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} textarea,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} textarea *,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} pre,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} pre *,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} code,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} code *
  {
    background-color: ${state.background.lightnessShift} !important;
  }

  .${c.COLOR_CHANGER_CLASS_NAME}${is} button,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} button *
  {
    color: ${state.link.hslString} !important;
    background-color: transparent !important;
  }
  .${c.COLOR_CHANGER_CLASS_NAME}${is} a,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} a *
  {
    color: ${state.link.hslString} !important;
    background-color: transparent !important;
  }
  .${c.COLOR_CHANGER_CLASS_NAME}${is} a:hover,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} a:hover *
  {
    color: ${state.linkHovered.hslString} !important;
    background-color: transparent !important;
  }
  .${c.COLOR_CHANGER_CLASS_NAME}${is} a:active,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} a:active *
  {
    color: ${state.linkVisited.hslString} !important;
    background-color: transparent !important;
  }
  .${c.COLOR_CHANGER_CLASS_NAME}${is} a:visited,
  .${c.COLOR_CHANGER_CLASS_NAME}${is} a:visited *
  {
    color: ${state.linkVisited.hslString} !important;
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

async function updateContent(state: SyncState | undefined) {
  c.LOG && console.log('cc - updateContent - state:', state);

  if (state == undefined) {
    state = await browser.storage.sync.get([c.TEXT_KEY, c.BACKGROUND_KEY, c.LINK_KEY, c.LINK_HOVERED_KEY, c.LINK_VISITED_KEY]) as SyncState;
  };

  if (await isSavedHost()) {
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
  let state = await browser.storage.sync.get([c.TEXT_KEY, c.BACKGROUND_KEY, c.LINK_KEY, c.LINK_HOVERED_KEY, c.LINK_VISITED_KEY]) as SyncState;
  updateContent(state);
}

init();

browser.runtime.onMessage.addListener(onMessage);
