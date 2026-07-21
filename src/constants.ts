import { type State, type Ui } from "./types";
import { createColor } from "./utils";

export const LOG = true;

export const STORAGE_ID = "colorChangerState";
export const GET_STATE = "GET_STATE";
export const SAVE_STATE = "SAVE_STATE";
export const UPDATE_CONTENT = "UPDATE_CONTENT";
export const CHANGE_COLORS = "CHANGE_COLORS";
export const UPDATE_COLOR = "UPDATE_COLOR";
export const CLEAR_STORAGE = "CLEAR_STORAGE";
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

export const VERSION = "5.0.0";

// state keys
export const VERSION_KEY = "version";
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

export const DEFAULT_STATE: State = {
  version: VERSION,
  activeTabId: INVALID_TAB,
  activeTabHostname: "",

  text: DEFAULT_TEXT_COLOR,
  background: DEFAULT_BACKGROUND_COLOR,
  link: DEFAULT_LINK_COLOR,
  linkHovered: DEFAULT_LINK_HOVERED_COLOR,
  linkVisited: DEFAULT_LINK_VISITED_COLOR,

  activeBtn: TEXT_KEY,
  hosts: [],
  lostConnection: false,
  invalidUrl: false,
}

export const DEFAULT_UI: Ui = {
  text: DEFAULT_TEXT_COLOR,
  background: DEFAULT_BACKGROUND_COLOR,
  link: DEFAULT_LINK_COLOR,
  linkHovered: DEFAULT_LINK_HOVERED_COLOR,
  linkVisited: DEFAULT_LINK_VISITED_COLOR,

  activeBtn: TEXT_KEY,
}
