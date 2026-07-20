import { type State } from "./types";
import { createColor } from "./utils";

export const LOG = true;

export const STORAGE_ID = "colorChangerState";
export const GET_STATE = "GET_STATE";
export const SAVE_STATE = "SAVE_STATE";
export const UPDATE_CONTENT = "UPDATE_CONTENT";
export const CHANGE_COLORS = "CHANGE_COLORS";
export const SET_ACTIVE_BUTTON = "SET_ACTIVE_BUTTON";
export const UPDATE_COLOR = "UPDATE_COLOR";
export const RESET = "RESET";
export const INVALID_TAB = -9999;

export const TEXT_KEY = "text";
export const BACKGROUND_KEY = "background";
export const LINK_KEY = "link";
export const LINK_HOVERED_KEY = "linkHovered";
export const LINK_VISITED_KEY = "linkVisited";

export const COLOR_CHANGER_STYLE_ID = "color-changer-style";
export const COLOR_CHANGER_CLASS_NAME = "color-changer-v5";

export const DEFAULT_STATE: State = {
  version: "5.0.0",
  activeTabId: INVALID_TAB,
  activeTabHostname: "",

  text: createColor(0, 0, 80),
  background: createColor(0, 0, 25),
  link: createColor(116, 33, 96),
  linkHovered: createColor(146, 33, 96),
  linkVisited: createColor(86, 33, 96),

  activeBtn: TEXT_KEY,
  hosts: [],
  lostConnection: false,
  invalidUrl: false,
}
