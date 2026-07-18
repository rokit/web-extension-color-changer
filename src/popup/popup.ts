import * as c from "../constants";
import { type State } from "../interfaces";
import { runtimeSendMessage, shouldChangeColors } from "../utils";

import { type Point } from "../interfaces";
import convert from 'color-convert';
import { degToRad, radToDeg, mapRange } from "../utils";

let selectedHue = 0;
let selectedSaturation = 0;
let selectedValue = 0;

let isHueMouseDown = false;
let isSquareMouseDown = false;

let colorPickerSize = 250;
let cpHalfWidth = colorPickerSize * 0.5;
let canvasSize = Math.round(colorPickerSize * 0.51);
let hueReticleDistance = colorPickerSize * 0.52;

let squareHsvElement = document.getElementById("square-hsv")! as HTMLDivElement;
let canvas = document.getElementById("square-canvas")! as HTMLCanvasElement;
let hueElement = document.getElementById("hue")!;
let squareReticleElement = document.getElementById("square-reticle")!;
let hueReticleElement = document.getElementById("hue-reticle")!;
let hexInputElement = document.getElementById("hex-input")! as HTMLInputElement;

canvas.width = canvasSize;
canvas.height = canvasSize;

let ctx = canvas.getContext("2d")!;

squareHsvElement.style.width = colorPickerSize + "px";
squareHsvElement.style.height = colorPickerSize + "px";

let canvasRect = canvas.getBoundingClientRect();
let cpRect = squareHsvElement.getBoundingClientRect();

// The center point of the hsl picker relative to the browser view.
let documentCpCenter: Point = { x: 0, y: 0 };
let squareReticle: Point = { x: canvasSize, y: 0 };
let hueReticle: Point = { x: hueReticleDistance, y: 0 };

hueElement.onmousedown = (e) => {
  isHueMouseDown = true;
  updateHueReticle(e);
}

canvas.onmousedown = (e) => {
  isSquareMouseDown = true;
  updateSquareReticle(e);
}

document.onmouseup = () => {
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

  let regex = /^(?:[0-9a-fA-F]{3}){1,2}$/;
  if (regex.test(hexInputValue)) {
    hexInputElement.classList.remove("hexError");
  } else {
    hexInputElement.classList.add("hexError");
    return;
  }

  let hsv = convert.hex.hsv(hexInputValue);
  selectedHue = hsv[0];
  selectedSaturation = hsv[1];
  selectedValue = hsv[2];

  squareReticle.x = mapRange(selectedSaturation, 0, 100, 0, canvas.width);
  squareReticle.y = mapRange(selectedValue, 0, 100, canvas.height, 0);
  updateSquareReticleElement();

  hueReticle.x = hueReticleDistance * Math.cos(degToRad(selectedHue));
  hueReticle.y = hueReticleDistance * Math.sin(degToRad(selectedHue));
  updateHueReticleElement();

  drawColorPicker();
}

function updateSquareReticle(e: MouseEvent) {
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

  let hex = hsvToHexInput();
  updateSquareReticleElement();
  runtimeSendMessage({ message: c.UPDATE_COLOR, payload: hex });
}

function updateHueReticle(e: MouseEvent) {
  updateDocumentCpCenter();

  // Get angle from delta x and y using center point.
  let angle = Math.atan2(
    e.clientY - documentCpCenter.y,
    e.clientX - documentCpCenter.x,
  );

  // Add 360 deg so we only deal with positive numbers.
  angle += 2 * Math.PI;

  selectedHue = radToDeg(angle) % 360;

  hueReticle.x = hueReticleDistance * Math.cos(angle);
  hueReticle.y = hueReticleDistance * Math.sin(angle);

  let hex = hsvToHexInput();
  updateHueReticleElement();
  runtimeSendMessage({ message: c.UPDATE_COLOR, payload: hex });
  drawColorPicker();
}

function updateDocumentCpCenter() {
  documentCpCenter.x = cpRect.x + (cpHalfWidth);
  documentCpCenter.y = cpRect.y + (cpHalfWidth);
}

/** Updated relative to color picker. */
function updateSquareReticleElement() {
  let offsetX = canvasRect.x - cpRect.x;
  let offsetY = canvasRect.y - cpRect.y;

  squareReticleElement.style.left = `${squareReticle.x + offsetX}px`;
  squareReticleElement.style.top = `${squareReticle.y + offsetY}px`;
}

/** Updated relative to color picker. */
function updateHueReticleElement() {
  let halfReticleWidth = hueReticleElement.clientWidth * 0.5;
  hueReticleElement.style.left = `${hueReticle.x + cpHalfWidth - halfReticleWidth}px`;
  hueReticleElement.style.top = `${hueReticle.y + cpHalfWidth - halfReticleWidth}px`;
  hueReticleElement.style.rotate = `${selectedHue}deg`
}

function drawColorPicker() {
  ctx.clearRect(0, 0, colorPickerSize, colorPickerSize);

  const cwidth = canvas.width;
  const imgData = ctx.createImageData(cwidth, cwidth);
  const data = imgData.data;

  for (let y = 0; y < cwidth; y++) {
    for (let x = 0; x < cwidth; x++) {
      let sat = mapRange(x, 0, cwidth, 0, 100);
      let val = mapRange(y, 0, cwidth, 100, 0);
      let rgb = convert.hsv.rgb(selectedHue, sat, val);

      const pixelIndex = (y * cwidth + x) * 4;

      data[pixelIndex] = rgb[0];
      data[pixelIndex + 1] = rgb[1];
      data[pixelIndex + 2] = rgb[2];
      data[pixelIndex + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function hsvToHexInput() {
  let hex = convert.hsv.hex(selectedHue, selectedSaturation, selectedValue);
  hexInputElement.classList.remove("hexError");
  hexInputElement.value = hex;
  return hex;
}

///////////////////////////////

let changeColorsCheckbox = document.getElementById("change-colors")! as HTMLInputElement;
let changeColorsLabel = document.getElementById("change-colors-label")! as HTMLInputElement;

let foreBtn = document.getElementById(c.FORE_BTN)! as HTMLButtonElement;
let backBtn = document.getElementById(c.BACK_BTN)! as HTMLButtonElement;
let linkBtn = document.getElementById(c.LINK_BTN)! as HTMLButtonElement;
let resetBtn = document.getElementById("reset")! as HTMLButtonElement;

let foreSwatch = document.getElementById(`${c.FORE_BTN}-swatch`)! as HTMLDivElement;
let backSwatch = document.getElementById(`${c.BACK_BTN}-swatch`)! as HTMLDivElement;
let linkSwatch = document.getElementById(`${c.LINK_BTN}-swatch`)! as HTMLDivElement;

changeColorsCheckbox.onclick = () => {
  runtimeSendMessage({ message: c.CHANGE_COLORS, payload: changeColorsCheckbox.checked });
};

resetBtn.onclick = function () {
  runtimeSendMessage({ message: c.RESET });
}

function onClickForeground() {
  runtimeSendMessage({ message: c.SET_ACTIVE_BUTTON, payload: c.FORE_BTN });
}
function onClickBackground() {
  runtimeSendMessage({ message: c.SET_ACTIVE_BUTTON, payload: c.BACK_BTN });
}
function onClickLink() {
  runtimeSendMessage({ message: c.SET_ACTIVE_BUTTON, payload: c.LINK_BTN });
}

foreSwatch.onclick = onClickForeground;
foreBtn.onclick = onClickForeground;
backSwatch.onclick = onClickBackground;
backBtn.onclick = onClickBackground;
linkSwatch.onclick = onClickLink;
linkBtn.onclick = onClickLink;

async function setActiveColorButton(state: State) {
  foreBtn.classList.remove("active-btn");
  backBtn.classList.remove("active-btn");
  linkBtn.classList.remove("active-btn");
  document.getElementById(state.activeBtn)!.classList.add("active-btn");
}

async function updateUi() {
  let state: State = await runtimeSendMessage({ message: c.GET_STATE });

  foreSwatch.style.background = state.fg.hsv;
  backSwatch.style.background = state.bg.hsv;
  linkSwatch.style.background = state.li.hsv;

  changeColorsCheckbox.checked = shouldChangeColors(state);

  if (state.activeTabId === c.INVALID_TAB) {
    changeColorsCheckbox.setAttribute("disabled", "disabled");
    changeColorsLabel.textContent = "Please reload this tab or activate a new tab.";
  } else if (state.invalidUrl) {
    changeColorsCheckbox.setAttribute("disabled", "disabled");
    changeColorsLabel.textContent = "Color Changer can't work on this page.";
  } else if (state.lostConnection) {
    changeColorsCheckbox.setAttribute("disabled", "disabled");
    changeColorsLabel.textContent = "Please reload this page.";
  } else {
    changeColorsCheckbox.removeAttribute("disabled");
    changeColorsLabel.textContent = "Change Colors";
  }

  setActiveColorButton(state);
}

updateDocumentCpCenter();
updateSquareReticleElement();
updateHueReticleElement();
drawColorPicker();

chrome.storage.onChanged.addListener(updateUi);

window.onload = updateUi;
