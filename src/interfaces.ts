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
  hue: number,
  saturation: number,
  value: number,
  hsv: string;
  valueShift: string;
  hueHovered: string;
  hueVisited: string;
  alpha: string;
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