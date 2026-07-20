export interface State {
  activeTabId: number;
  activeTabHostname: string;
  fg: Color;
  bg: Color;
  li: Color;
  activeBtn: string;
  hosts: string[];
  lostConnection: boolean;
  invalidUrl: boolean;
}

export interface Color {
  hsv: Hsv,
  hslString: string;
  lightnessShift: string;
  hueHovered: string;
  hueVisited: string;
}

export type Hsv = {
  h: number,
  s: number,
  v: number,
}

export interface Message {
  message: string;
  payload?: any;
}

export type Point = {
  x: number;
  y: number;
}

export type TabActiveInfo = {
  tabId: number;
  windowId: number;
}