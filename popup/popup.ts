import { ALWAYS, CHANGE_COLORS, CHANGE_LIGHTNESS, GET_STATE, RESET, SET_ACTIVE_BUTTON, UPDATE_CHOSEN_COLOR } from "../constants";
import { CanvasSwatch, State } from "../interfaces";

let lightnessSlider = <HTMLInputElement>document.getElementById("lightness")!;
let lightnessValue = document.getElementById("lightness-value")!;

let info = document.getElementById("info")!;
let infoText = document.getElementById("info-text")!;

let changeColorsCheckbox = <HTMLInputElement>document.getElementById("change-colors")!;
let alwaysCheckbox = <HTMLInputElement>document.getElementById("always")!;
let alwaysLabel = document.getElementById("always-label")!;

let foreBtn = document.getElementById("fore")!;
let backBtn = document.getElementById("back")!;
let linkBtn = document.getElementById("link")!;
let resetBtn = document.getElementById("reset")!;

let foreSwatch = document.getElementById("fore-swatch")!;
let backSwatch = document.getElementById("back-swatch")!;
let linkSwatch = document.getElementById("link-swatch")!;

changeColorsCheckbox.onclick = () => {
  chrome.runtime.sendMessage({ message: CHANGE_COLORS, payload: changeColorsCheckbox.checked });
};

alwaysCheckbox.onclick = () => {
  chrome.runtime.sendMessage({ message: ALWAYS, payload: alwaysCheckbox.checked });
};

async function alwaysMouseover() {
  let state = await chrome.runtime.sendMessage({ message: GET_STATE });
  infoText.textContent = `Always change colors on host: ${state.activeTabHostname}`;
  info.style.opacity = "1";
}

function alwaysMouseout() {
  info.style.opacity = "0";
}

alwaysCheckbox.onmouseover = alwaysMouseover;
alwaysCheckbox.onmouseout = alwaysMouseout;
alwaysLabel.onmouseover = alwaysMouseover;
alwaysLabel.onmouseout = alwaysMouseout;

resetBtn.onclick = function () {
  chrome.runtime.sendMessage({ message: RESET });
}

lightnessSlider.addEventListener('input', function () {
  lightnessValue.childNodes[0].nodeValue = `${this.value}%`;
})

lightnessSlider.addEventListener('change', function () {
  lightnessValue.childNodes[0].nodeValue = `${this.value}%`;
  let lightness = parseInt(this.value);
  chrome.runtime.sendMessage({ message: CHANGE_LIGHTNESS, payload: lightness });
})

function onClickForeground() {
  chrome.runtime.sendMessage({ message: SET_ACTIVE_BUTTON, payload: "fore" });
}
function onClickBackground() {
  chrome.runtime.sendMessage({ message: SET_ACTIVE_BUTTON, payload: "back" });
}
function onClickLink() {
  chrome.runtime.sendMessage({ message: SET_ACTIVE_BUTTON, payload: "link" });
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

  foreSwatch.classList.remove("active-swatch");
  backSwatch.classList.remove("active-swatch");
  linkSwatch.classList.remove("active-swatch");
  document.getElementById(`${state.activeBtn}-swatch`)!.classList.add("active-swatch");
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

var swatches = {};

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
    (state.activeBtn === "fore" && state.fg.swatch.chosenId === "zero") ||
    (state.activeBtn === "back" && state.bg.swatch.chosenId === "zero") ||
    (state.activeBtn === "link" && state.li.swatch.chosenId === "zero")) {
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

      if ((state.activeBtn === "fore" && state.fg.swatch.chosenId === id) ||
        (state.activeBtn === "back" && state.bg.swatch.chosenId === id) ||
        (state.activeBtn === "link" && state.li.swatch.chosenId === id)) {
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
  let state = await chrome.runtime.sendMessage({ message: GET_STATE });

  foreSwatch.style.background = state.fg.hsl;
  backSwatch.style.background = state.bg.hsl;
  linkSwatch.style.background = state.li.hsl;

  changeColorsCheckbox.checked = state.changeColors;
  alwaysCheckbox.checked = state.always;
  lightnessSlider.value = state.lightness.toString();
  lightnessValue.childNodes[0].nodeValue = `${state.lightness}%`;

  setActiveColorButton(state);
  drawCanvas(state);
}

chrome.storage.onChanged.addListener(updateUi);

window.onload = updateUi;
