import { type State } from "./interfaces";
import { createColor } from "./utils";

export const SHOULD_CONSOLE_LOG = true;

export const GET_STATE = "GET_STATE";
export const SAVE_STATE = "SAVE_STATE";
export const UPDATE_CONTENT = "UPDATE_CONTENT";
export const CHANGE_COLORS = "CHANGE_COLORS";
export const SET_ACTIVE_BUTTON = "SET_ACTIVE_BUTTON";
export const UPDATE_COLOR = "UPDATE_COLOR";
export const RESET = "RESET";
export const INVALID_TAB = -9999;

export const FORE_BTN = "fore";
export const BACK_BTN = "back";
export const LINK_BTN = "link";

export const COLOR_CHANGER_STYLE_ID = "color-changer-style";
export const COLOR_CHANGER_CLASS_NAME = "color-changer-v5";

export const DEFAULT_STATE: State = {
  activeTabId: INVALID_TAB,
  activeTabHostname: "",
  fg: createColor(0, 0, 80),
  bg: createColor(0, 0, 25),
  li: createColor(116, 33, 96),
  activeBtn: FORE_BTN,
  hosts: [],
  lostConnection: false,
  invalidUrl: false,
}
