import { State } from "./interfaces";
import { createColor } from "./utils";

export const GET_STATE = "GET_STATE";
export const UPDATE_CONTENT = "UPDATE_CONTENT";
export const CHANGE_COLORS = "CHANGE_COLORS";
export const SET_ACTIVE_BUTTON = "SET_ACTIVE_BUTTON";
export const UPDATE_CHOSEN_COLOR = "UPDATE_CHOSEN_COLOR";
export const CHANGE_LIGHTNESS = "CHANGE_LIGHTNESS";
export const RESET = "RESET";

export const FORE_BTN = "fore";
export const BACK_BTN = "back";
export const LINK_BTN = "link";

export const COLOR_CHANGER_STYLE_ID = "color-changer-style";
export const COLOR_CHANGER_CLASS_NAME = "color-changer-v4";

export const DEFAULT_STATE: State = {
  changeColors: false,
  activeTabId: null,
  activeTabHostname: "",
  fg: createColor(0, 0, 80, 'zero'),
  bg: createColor(0, 0, 25, 'zero'),
  li: createColor(68, 80, 80, '2-6'),
  activeBtn: FORE_BTN,
  lightness: 80,
  hosts: [],
}
