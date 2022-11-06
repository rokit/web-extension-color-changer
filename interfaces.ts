export interface State {
  activeTabId: number;
  activeTabHostname: string;
  fg: Color;
  bg: Color;
  li: Color;
  activeBtn: string;
  lightness: number;
  hosts: string[];
  lostConnection: boolean;
  invalidUrl: boolean;
}

export interface Swatch {
  hue: number;
  saturation: number;
  lightness: number;
  chosenId: string;
}

export interface Color {
  swatch: Swatch,
  hsl: string;
  lightnessShift: string;
  hueHovered: string;
  hueVisited: string;
  alpha: string;
}

export interface Message {
  message: string;
  payload?: any;
}

export interface CanvasSwatch {
  hovered: boolean;
  hsl: string;
  hue: number;
  id: string;
  lightness: number;
  radius: number;
  saturation: number;
  x: number;
  y: number;
}