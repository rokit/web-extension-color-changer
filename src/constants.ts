import { type State, type ColorState } from "./types";
import { createColor, createColorV4 } from "./utils";

export const LOG = true;

export const UPDATE_CONTENT = "UPDATE_CONTENT";
export const CONTEXT_MENU_ID = "CHANGE_COLORS";
export const INVALID_TAB = -9999;

export const COLOR_CHANGER_STYLE_ID = "color-changer-style";
export const COLOR_CHANGER_CLASS_NAME = "color-changer-v5";

export const DISALLOWED_PROTOCOLS = [
  "about:",
  "chrome:",
  "edge:",
  "chrome-extension:",
  "moz-extension:",
  "view-source:",
  "javascript:",
  "data:",
];

export const DISALLOWED_HOSTNAMES = [
  "addons.mozilla.org",
  "chromewebstore.google.com",
];

// state keys
export const ACTIVE_TAB_ID_KEY = "activeTabId";
export const ACTIVE_TAB_HOSTNAME_KEY = "activeTabHostname";

export const TEXT_KEY = "text";
export const BACKGROUND_KEY = "background";
export const LINK_KEY = "link";
export const LINK_HOVERED_KEY = "linkHovered";
export const LINK_VISITED_KEY = "linkVisited";

export const ACTIVE_BTN_KEY = "activeBtn";
export const HOSTS_KEY = "hosts";
export const LOST_CONNECTION_KEY = "lostConnection";
export const INVALID_URL_KEY = "invalidUrl";

export const DEFAULT_TEXT_COLOR = createColor(0, 0, 80);
export const DEFAULT_BACKGROUND_COLOR = createColor(0, 0, 18);
export const DEFAULT_LINK_COLOR = createColor(180, 33, 96);
export const DEFAULT_LINK_HOVERED_COLOR = createColor(120, 33, 96);
export const DEFAULT_LINK_VISITED_COLOR = createColor(240, 33, 96);

/** State used by the extension. */
export const DEFAULT_STATE: State = {
  [ACTIVE_TAB_ID_KEY]: INVALID_TAB,
  [ACTIVE_TAB_HOSTNAME_KEY]: "",

  [TEXT_KEY]: DEFAULT_TEXT_COLOR,
  [BACKGROUND_KEY]: DEFAULT_BACKGROUND_COLOR,
  [LINK_KEY]: DEFAULT_LINK_COLOR,
  [LINK_HOVERED_KEY]: DEFAULT_LINK_HOVERED_COLOR,
  [LINK_VISITED_KEY]: DEFAULT_LINK_VISITED_COLOR,

  [ACTIVE_BTN_KEY]: TEXT_KEY,
  [HOSTS_KEY]: [],
  [LOST_CONNECTION_KEY]: false,
  [INVALID_URL_KEY]: false,
}

/** Subset of state above used for the ui. */
export const DEFAULT_COLOR_STATE: ColorState = {
  [TEXT_KEY]: DEFAULT_TEXT_COLOR,
  [BACKGROUND_KEY]: DEFAULT_BACKGROUND_COLOR,
  [LINK_KEY]: DEFAULT_LINK_COLOR,
  [LINK_HOVERED_KEY]: DEFAULT_LINK_HOVERED_COLOR,
  [LINK_VISITED_KEY]: DEFAULT_LINK_VISITED_COLOR,

  [ACTIVE_BTN_KEY]: TEXT_KEY,
}

export const STATE_V4 = {
  activeTabId: INVALID_TAB,
  activeTabHostname: "",
  fg: createColorV4(0, 0, 20),
  bg: createColorV4(0, 0, 10),
  li: createColorV4(32, 40, 40),
  activeBtn: "fore",
  lightness: 80,
  hosts: ["asdf.yo.com", "test.one.two"],
  lostConnection: false,
  invalidUrl: false,
}
