import { BACK_BTN, CHANGE_COLORS, CHANGE_LIGHTNESS, FORE_BTN, GET_STATE, LINK_BTN, RESET, SET_ACTIVE_BUTTON, UPDATE_CHOSEN_COLOR } from "../constants";
import { CanvasSwatch, State } from "../interfaces";
import { shouldChangeColors } from "../utils";

let lightnessSlider = <HTMLInputElement>document.getElementById("lightness")!;
let lightnessValue = document.getElementById("lightness-value")!;

let changeColorsCheckbox = <HTMLInputElement>document.getElementById("change-colors")!;

let foreBtn = document.getElementById(FORE_BTN)!;
let backBtn = document.getElementById(BACK_BTN)!;
let linkBtn = document.getElementById(LINK_BTN)!;
let resetBtn = document.getElementById("reset")!;

let foreSwatch = document.getElementById(`${FORE_BTN}-swatch`)!;
let backSwatch = document.getElementById(`${BACK_BTN}-swatch`)!;
let linkSwatch = document.getElementById(`${LINK_BTN}-swatch`)!;

changeColorsCheckbox.onclick = () => {
  chrome.runtime.sendMessage({ message: CHANGE_COLORS, payload: changeColorsCheckbox.checked });
};

resetBtn.onclick = function () {
  chrome.runtime.sendMessage({ message: RESET });
}

lightnessSlider.addEventListener('input', function () {
  lightnessValue.childNodes[0].nodeValue = `${this.value}%`;
})

lightnessSlider.addEventListener('change', function () {
  lightnessValue.childNodes[0].nodeValue = `${this.value}%`;
  chrome.runtime.sendMessage({ message: CHANGE_LIGHTNESS, payload: parseInt(this.value) });
})

function onClickForeground() {
  chrome.runtime.sendMessage({ message: SET_ACTIVE_BUTTON, payload: FORE_BTN });
}
function onClickBackground() {
  chrome.runtime.sendMessage({ message: SET_ACTIVE_BUTTON, payload: BACK_BTN });
}
function onClickLink() {
  chrome.runtime.sendMessage({ message: SET_ACTIVE_BUTTON, payload: LINK_BTN });
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Canvas
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
function createCanvasSwatch(x: number, y: number, id: string, radius: number, hue: number, saturation: number, lightness: number): CanvasSwatch {
  return {
    x,
    y,
    id,
    hovered: false,
    radius,
    hue,
    saturation,
    lightness,
    hsl: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
  }
}

function updateCanvasSwatch(swatch: CanvasSwatch, hue: number, saturation: number, lightness: number) {
  swatch.hue = hue;
  swatch.saturation = saturation;
  swatch.lightness = lightness;
  swatch.hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

var canvas = <HTMLCanvasElement>document.getElementById("cc-canvas")!;
var ctx = canvas.getContext("2d")!;
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
var canvasHeight = canvas.offsetHeight;

var originX = canvas.width / 2;
var originY = canvas.height / 2;

var bigRadius = canvasHeight / 6;
var littleRadius = canvasHeight / 30;
var ellipseLength = 1.5;

var gap = canvasHeight / 14;
var littleGap = canvasHeight / 30;
var numSwatches = 16;
var steps = numSwatches / 2;
var rings = 3;
var saturationSteps = 100 / rings;
var strokeColor = "#555555";

let strokeHoverWidth = 5;

let zeroSatOffsetX = originX - canvas.width * 0.40;
let zeroSatOffsetY = originY + canvas.width * 0.3;

let zeroSatTextOffsetY = zeroSatOffsetY - 30;
let satRadius = bigRadius * 0.5;

var hoverId = null;

var swatches: { [index: string]: CanvasSwatch } = {};

function toRads(degrees: number) {
  return degrees * (Math.PI / 180);
}

async function drawCanvas(state: State) {
  ctx.fillStyle = "white";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = '16pt Helvetica';
  ctx.fillText("Gray", zeroSatOffsetX, zeroSatTextOffsetY);

  ctx.beginPath();
  ctx.arc(zeroSatOffsetX, zeroSatOffsetY, satRadius, 0, 2 * Math.PI, true);
  ctx.fillStyle = `hsl(0, 0%, ${state.lightness}%)`;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  // hoverId === "zero" ? ctx.lineWidth = strokeHoverWidth : ctx.lineWidth = 1;

  if (
    (state.activeBtn === FORE_BTN && state.fg.swatch.chosenId === "zero") ||
    (state.activeBtn === BACK_BTN && state.bg.swatch.chosenId === "zero") ||
    (state.activeBtn === LINK_BTN && state.li.swatch.chosenId === "zero")) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = strokeHoverWidth;
    ctx.setLineDash([5, 2]);
  }
  ctx.stroke();
  ctx.setLineDash([0]);
  ctx.lineWidth = 1;

  if (swatches["zero"]) {
    updateCanvasSwatch(swatches["zero"], 0, 0, state.lightness);
  } else {
    swatches["zero"] = createCanvasSwatch(zeroSatOffsetX, zeroSatOffsetY, "zero", satRadius, 0, 0, state.lightness);
  }

  for (var j = 0; j < rings; j++) {
    let adjustedNumSwatches = numSwatches + (j * steps);
    for (var i = 0; i < adjustedNumSwatches; i++) {
      let angle = 360 / adjustedNumSwatches;
      let x = originX + ((bigRadius + gap + (j * littleGap) + (j * littleRadius * 2)) * Math.cos(toRads(angle * i)));
      let y = originY + ((bigRadius + gap + (j * littleGap) + (j * littleRadius * 2)) * Math.sin(toRads(angle * i)));

      let hue = angle * i;
      let saturation = (j * saturationSteps + (100 - (saturationSteps * (rings - 1))));

      let id = `${j}-${i}`;

      ctx.beginPath();
      ctx.ellipse(x, y, littleRadius, littleRadius * ellipseLength, toRads(hue - 45), 0, 2 * Math.PI, false);
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${state.lightness}%)`;
      ctx.fill();

      if (swatches[id]) {
        updateCanvasSwatch(swatches[id], hue, saturation, state.lightness);
      } else {
        swatches[id] = createCanvasSwatch(x, y, id, littleRadius, hue, saturation, state.lightness);
      }

      ctx.strokeStyle = strokeColor;
      // hoverId === id ? ctx.lineWidth = strokeHoverWidth : ctx.lineWidth = 1;

      if ((state.activeBtn === FORE_BTN && state.fg.swatch.chosenId === id) ||
        (state.activeBtn === BACK_BTN && state.bg.swatch.chosenId === id) ||
        (state.activeBtn === LINK_BTN && state.li.swatch.chosenId === id)) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = strokeHoverWidth;
        ctx.setLineDash([5, 2]);
      }
      ctx.stroke();
      ctx.setLineDash([0]);
      ctx.lineWidth = 1;
    }
  }

  // if (hoverId) {
  //   ctx.beginPath();
  //   ctx.arc(originX, originY, bigRadius, 0, 2 * Math.PI, false);
  //   ctx.fillStyle = swatches[hoverId].hsl;
  //   ctx.fill();
  //   ctx.closePath();
  //   ctx.lineWidth = 1;
  //   ctx.strokeStyle = strokeColor;
  //   ctx.stroke();
  // }
}

function checkCollision(swatches, x, y) {
  for (var s in swatches) {
    var left = swatches[s].x - swatches[s].radius;
    var right = swatches[s].x + swatches[s].radius;
    var top = swatches[s].y - swatches[s].radius;
    var bottom = swatches[s].y + swatches[s].radius;

    if (right >= x
      && left <= x
      && bottom >= y
      && top <= y) {
      return swatches[s];
    }
  }
  return null;
}

canvas.onclick = function (e) {
  var swatch = checkCollision(swatches, e.offsetX, e.offsetY);
  if (!swatch) return;
  chrome.runtime.sendMessage({ message: UPDATE_CHOSEN_COLOR, payload: swatch });
}

canvas.onmouseout = async function () {
  let state = await chrome.runtime.sendMessage({ message: GET_STATE });
  hoverId = null;
  drawCanvas(state);
}

canvas.onmousemove = async function (e) {
  var swatch = checkCollision(swatches, e.offsetX, e.offsetY);

  if (swatch) {
    let state = await chrome.runtime.sendMessage({ message: GET_STATE });
    hoverId = swatch.id;

    drawCanvas(state);

    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'default';
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

async function updateUi() {
  let state: State = await chrome.runtime.sendMessage({ message: GET_STATE });

  foreSwatch.style.background = state.fg.hsl;
  backSwatch.style.background = state.bg.hsl;
  linkSwatch.style.background = state.li.hsl;

  changeColorsCheckbox.checked = shouldChangeColors(state);
  lightnessSlider.value = state.lightness.toString();
  lightnessValue.childNodes[0].nodeValue = `${state.lightness}%`;

  setActiveColorButton(state);
  drawCanvas(state);
}

chrome.storage.onChanged.addListener(updateUi);

window.onload = updateUi;
