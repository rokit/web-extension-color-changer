export type State = {
  version: string,
  activeTabId: number;
  activeTabHostname: string;

  text: Color;
  background: Color;
  link: Color;
  linkHovered: Color;
  linkVisited: Color;

  activeBtn: string;
  hosts: string[];
  lostConnection: boolean;
  invalidUrl: boolean;
}

export type Color = {
  hsv: Hsv,
  hslString: string;
  lightnessShift: string;
}

export type Hsv = {
  h: number,
  s: number,
  v: number,
}

export type Message = {
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