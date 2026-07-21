import * as c from "../constants";
import { type State, type Point, type Color } from "../types";
import { shouldChangeColors, degToRad, radToDeg, mapRange, updateContextMenu, sendTabMessage } from "../utils";
import convert from 'color-convert';
import { MockBrowser } from "../mockBrowser";

if (!globalThis.browser) {
  if (typeof window.chrome == "undefined") {
    // development mode
    // @ts-ignore
    globalThis.browser = new MockBrowser();
  } else {
    // @ts-ignore
    globalThis.browser = chrome;
  }
}

let selectedHue = 0;
let selectedSaturation = 100;
let selectedValue = 100;

let isHueMouseDown = false;
let isSquareMouseDown = false;

let colorPickerSize = 250;
let cpHalfWidth = colorPickerSize * 0.5;
let canvasSize = Math.round(colorPickerSize * 0.51);
let hueReticleDistance = colorPickerSize * 0.50;

let squareHsvElement = document.getElementById("square-hsv")! as HTMLDivElement;
let canvas = document.getElementById("square-canvas")! as HTMLCanvasElement;
let hueElement = document.getElementById("hue")!;
let squareReticleElement = document.getElementById("square-reticle")!;
let hueReticleElement = document.getElementById("hue-reticle")!;
let hexInputElement = document.getElementById("hex-input")! as HTMLInputElement;

let selectedHueElement = document.getElementById("selected-hue")! as HTMLSpanElement;
let selectedSaturationElement = document.getElementById("selected-saturation")! as HTMLSpanElement;
let selectedValueElement = document.getElementById("selected-value")! as HTMLSpanElement;

canvas.width = canvasSize;
canvas.height = canvasSize;

let ctx = canvas.getContext("2d")!;

squareHsvElement.style.width = colorPickerSize + "px";
squareHsvElement.style.height = colorPickerSize + "px";

// The center point of the hsl picker relative to the browser view.
let documentCpCenter: Point = { x: 0, y: 0 };
let squareReticle: Point = { x: canvasSize, y: 0 };
let hueReticle: Point = { x: hueReticleDistance, y: 0 };

function onHueMousedown(e: MouseEvent) {
  isHueMouseDown = true;
  updateDocumentCpCenter();
  updateHueReticle(e);
};

hueElement.onmousedown = onHueMousedown;
hueReticleElement.onmousedown = onHueMousedown;

canvas.onmousedown = (e) => {
  isSquareMouseDown = true;
  updateSquareReticle(e);
}

document.onmouseup = () => {
  if (isHueMouseDown || isSquareMouseDown) {
    browser.runtime.sendMessage({ message: c.UPDATE_COLOR, payload: { hue: selectedHue, saturation: selectedSaturation, value: selectedValue } });
  }

  isHueMouseDown = false;
  isSquareMouseDown = false;
};

document.onmousemove = (e: MouseEvent) => {
  if (isSquareMouseDown) {
    updateSquareReticle(e);
  } else if (isHueMouseDown) {
    updateHueReticle(e);
  }
}

hexInputElement.oninput = () => {
  let hexInputValue = hexInputElement.value;
  hexInputValue = hexInputValue.replace("#", "");
  hexInputValue = hexInputValue.replace(" ", "");
  hexInputElement.value = hexInputValue;

  let regex = /^(?:[0-9a-fA-F]{6})$/;
  if (regex.test(hexInputValue)) {
    hexInputElement.classList.remove("hexError");
  } else {
    hexInputElement.classList.add("hexError");
    return;
  }

  let hsv = convert.hex.hsv.raw(hexInputValue);
  selectedHue = hsv[0];
  selectedSaturation = hsv[1];
  selectedValue = hsv[2];

  updateReticlesFromHsv();
  drawColorPicker();
  browser.runtime.sendMessage({ message: c.UPDATE_COLOR, payload: { hue: selectedHue, saturation: selectedSaturation, value: selectedValue } });
}

function updateReticlesFromHsv() {
  squareReticle.x = mapRange(selectedSaturation, 0, 100, 0, canvas.width);
  squareReticle.y = mapRange(selectedValue, 0, 100, canvas.height, 0);
  updateSquareReticleElement();

  hueReticle.x = hueReticleDistance * Math.cos(degToRad(selectedHue));
  hueReticle.y = hueReticleDistance * Math.sin(degToRad(selectedHue));
  updateHueReticleElement();
}

function updateSquareReticle(e: MouseEvent) {
  let canvasRect = canvas.getBoundingClientRect();

  squareReticle.x = e.clientX - canvasRect.x;
  squareReticle.y = e.clientY - canvasRect.y;
  squareReticle.x = Math.max(squareReticle.x, 0);
  squareReticle.y = Math.max(squareReticle.y, 0);
  squareReticle.x = Math.min(squareReticle.x, canvas.width);
  squareReticle.y = Math.min(squareReticle.y, canvas.height);

  selectedSaturation = mapRange(
    squareReticle.x,
    0,
    canvas.width,
    0,
    100
  );

  selectedValue = mapRange(
    squareReticle.y,
    0,
    canvas.height,
    100,
    0
  );

  selectedSaturation = Math.round(selectedSaturation);
  selectedValue = Math.round(selectedValue);

  updateHexInput();
  updateSquareReticleElement();
}

function updateHueReticle(e: MouseEvent) {
  // Get angle from delta x and y using center point.
  let angle = Math.atan2(
    e.clientY - documentCpCenter.y,
    e.clientX - documentCpCenter.x,
  );

  // Add 360 deg so we only deal with positive numbers.
  angle += 2 * Math.PI;

  selectedHue = Math.round(radToDeg(angle) % 360);

  hueReticle.x = hueReticleDistance * Math.cos(degToRad(selectedHue));
  hueReticle.y = hueReticleDistance * Math.sin(degToRad(selectedHue));

  updateHexInput();
  updateHueReticleElement();
  drawColorPicker();
}

function updateDocumentCpCenter() {
  let cpRect = squareHsvElement.getBoundingClientRect();
  documentCpCenter.x = cpRect.x + (cpHalfWidth);
  documentCpCenter.y = cpRect.y + (cpHalfWidth);
}

/** Updated relative to color picker. */
function updateSquareReticleElement() {
  let cpRect = squareHsvElement.getBoundingClientRect();
  let canvasRect = canvas.getBoundingClientRect();

  let offsetX = canvasRect.x - cpRect.x;
  let offsetY = canvasRect.y - cpRect.y;

  squareReticleElement.style.left = `${squareReticle.x + offsetX}px`;
  squareReticleElement.style.top = `${squareReticle.y + offsetY}px`;

  selectedSaturationElement.textContent = selectedSaturation.toFixed(0);
  selectedValueElement.textContent = selectedValue.toFixed(0);
}

/** Updated relative to color picker. */
function updateHueReticleElement() {
  let halfReticleWidth = hueReticleElement.clientWidth * 0.5;
  hueReticleElement.style.left = `${hueReticle.x + cpHalfWidth - halfReticleWidth}px`;
  hueReticleElement.style.top = `${hueReticle.y + cpHalfWidth - halfReticleWidth}px`;
  hueReticleElement.style.rotate = `${selectedHue}deg`

  selectedHueElement.textContent = selectedHue.toFixed(0);
}

function drawColorPicker() {
  const cwidth = canvas.width;
  ctx.clearRect(0, 0, cwidth, cwidth);
  const imageData = ctx.createImageData(cwidth, cwidth);

  for (let y = 0; y < cwidth; y++) {
    for (let x = 0; x < cwidth; x++) {
      let sat = mapRange(x, 0, cwidth, 0, 100);
      let val = mapRange(y, 0, cwidth, 100, 0);
      let rgb = convert.hsv.rgb(selectedHue, sat, val);

      const pixelIndex = (y * cwidth + x) * 4;

      imageData.data[pixelIndex] = rgb[0];
      imageData.data[pixelIndex + 1] = rgb[1];
      imageData.data[pixelIndex + 2] = rgb[2];
      imageData.data[pixelIndex + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function updateHexInput() {
  let hex = convert.hsv.hex(selectedHue, selectedSaturation, selectedValue);
  hexInputElement.classList.remove("hexError");
  hexInputElement.value = hex;
}

///////////////////////////////

let changeColorsCheckbox = document.getElementById("change-colors")! as HTMLInputElement;
let changeColorsLabel = document.getElementById("change-colors-label")! as HTMLInputElement;
let checkboxContainer = document.getElementById("checkbox-container")! as HTMLDivElement;
let errorElement = document.getElementById("error")! as HTMLDivElement;
let footerElement = document.getElementsByTagName("footer")[0]! as HTMLElement;

let textBtn = document.getElementById(c.TEXT_KEY)! as HTMLButtonElement;
let backgroundBtn = document.getElementById(c.BACKGROUND_KEY)! as HTMLButtonElement;
let linkBtn = document.getElementById(c.LINK_KEY)! as HTMLButtonElement;
let linkHoveredBtn = document.getElementById(c.LINK_HOVERED_KEY)! as HTMLButtonElement;
let linkVisitedBtn = document.getElementById(c.LINK_VISITED_KEY)! as HTMLButtonElement;

let resetBtn = document.getElementById("reset")! as HTMLButtonElement;

changeColorsCheckbox.onclick = () => {
  browser.runtime.sendMessage({ message: c.CHANGE_COLORS, payload: changeColorsCheckbox.checked });
};

/** Sets back to defaults. Does not reset:
 * - activeTabId
 * - activeTabHostname
*/
resetBtn.onclick = async function () {
  await browser.storage.sync.set({ [c.TEXT_KEY]: c.DEFAULT_TEXT_COLOR });
  await browser.storage.sync.set({ [c.BACKGROUND_KEY]: c.DEFAULT_BACKGROUND_COLOR });
  await browser.storage.sync.set({ [c.LINK_KEY]: c.DEFAULT_LINK_COLOR });
  await browser.storage.sync.set({ [c.LINK_HOVERED_KEY]: c.DEFAULT_LINK_HOVERED_COLOR });
  await browser.storage.sync.set({ [c.LINK_VISITED_KEY]: c.DEFAULT_LINK_VISITED_COLOR });

  await browser.storage.sync.set({ [c.ACTIVE_BTN_KEY]: c.TEXT_KEY });
  await browser.storage.sync.set({ [c.HOSTS_KEY]: [] });
  await browser.storage.sync.set({ [c.LOST_CONNECTION_KEY]: false });
  await browser.storage.sync.set({ [c.INVALID_URL_KEY]: false });

  updateContextMenu();
  sendTabMessage({ message: c.UPDATE_CONTENT });
}

function onClickForeground() {
  browser.storage.sync.set({ [c.ACTIVE_BTN_KEY]: c.TEXT_KEY });
}

function onClickBackground() {
  browser.storage.sync.set({ [c.ACTIVE_BTN_KEY]: c.BACKGROUND_KEY });
}

function onClickLink() {
  browser.storage.sync.set({ [c.ACTIVE_BTN_KEY]: c.LINK_KEY });
}

function onClickLinkHovered() {
  browser.storage.sync.set({ [c.ACTIVE_BTN_KEY]: c.LINK_HOVERED_KEY });
}

function onClickLinkVisited() {
  browser.storage.sync.set({ [c.ACTIVE_BTN_KEY]: c.LINK_VISITED_KEY });
}

textBtn.onclick = onClickForeground;
backgroundBtn.onclick = onClickBackground;
linkBtn.onclick = onClickLink;
linkHoveredBtn.onclick = onClickLinkHovered;
linkVisitedBtn.onclick = onClickLinkVisited;

function addClearStorageBtn() {
  if (!c.LOG) return;

  let button = document.createElement("button") as HTMLButtonElement;
  button.textContent = "Clear storage";
  button.onclick = function () {
    browser.runtime.sendMessage({ message: c.CLEAR_STORAGE });
  }

  footerElement.appendChild(button);
}

async function setActiveColorButton(button: string) {
  textBtn.classList.remove("active-btn");
  backgroundBtn.classList.remove("active-btn");
  linkBtn.classList.remove("active-btn");
  linkHoveredBtn.classList.remove("active-btn");
  linkVisitedBtn.classList.remove("active-btn");
  document.getElementById(button)!.classList.add("active-btn");
}

function updateColorPickerFromState(color: Color) {
  selectedHue = color.hsv.h;
  selectedSaturation = color.hsv.s;
  selectedValue = color.hsv.v;

  updateHexInput();
  updateReticlesFromHsv();
  drawColorPicker();
}

async function updateUi(changes: any) {
  console.log('cc - updateUi - changes:', changes);
  let state = await browser.storage.sync.get([c.TEXT_KEY, c.BACKGROUND_KEY, c.LINK_KEY, c.LINK_HOVERED_KEY, c.LINK_VISITED_KEY, c.ACTIVE_BTN_KEY, c.ACTIVE_TAB_ID_KEY, c.INVALID_URL_KEY, c.LOST_CONNECTION_KEY]);

  textBtn.style.background = state.text.hslString;
  backgroundBtn.style.background = state.background.hslString;
  linkBtn.style.background = state.link.hslString;
  linkHoveredBtn.style.background = state.linkHovered.hslString;
  linkVisitedBtn.style.background = state.linkVisited.hslString;

  changeColorsCheckbox.checked = await shouldChangeColors();

  errorElement.classList.add("show");
  if (state.activeTabId === c.INVALID_TAB) {
    changeColorsCheckbox.setAttribute("disabled", "disabled");
    errorElement.textContent = "Invalid tab ID. Activate a new tab.";
  } else if (state.invalidUrl) {
    changeColorsCheckbox.setAttribute("disabled", "disabled");
    errorElement.textContent = "Color Changer can't work on this page.";
  } else if (state.lostConnection) {
    changeColorsCheckbox.setAttribute("disabled", "disabled");
    errorElement.textContent = "Lost connection to tab. Try reloading the page. Your browser could also be preventing extensions from running on this page.";
  } else {
    changeColorsCheckbox.removeAttribute("disabled");
    errorElement.textContent = "";
    errorElement.classList.remove("show");
  }

  updateDocumentCpCenter();
  setActiveColorButton(state.activeBtn);
  updateColorPickerFromState(state[state.activeBtn]);
}

addClearStorageBtn();
updateDocumentCpCenter();
updateSquareReticleElement();
updateHueReticleElement();
drawColorPicker();

browser.storage.onChanged.addListener(updateUi);

window.onload = updateUi;
