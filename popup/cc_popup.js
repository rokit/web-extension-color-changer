var bIsChrome = /Chrome/.test(navigator.userAgent);
var state = null;

function Swatch(x, y, id, radius, hue, saturation, lightness) {
  this.x = x;
  this.y = y;
  this.id = id;
  this.hovered = false;
  this.radius = radius;
  this.hue = hue;
  this.saturation = saturation;
  this.lightness = lightness;
  this.hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function updateSwatch(swatch, hue, saturation, lightness) {
  swatch.hue = hue;
  swatch.saturation = saturation;
  swatch.lightness = lightness;
  swatch.hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

var lightnessSlider = document.getElementById("lightness");
var lightnessValue = document.getElementById("lightness-value");

lightnessSlider.oninput = function () {
  lightnessValue.childNodes[0].nodeValue = `${this.value}%`;
  let lightness = parseInt(this.value);
  sendRuntimeMessage('updateLightness', lightness);
}

var info = document.getElementById("info");
var infoText = document.querySelector("#info p");

var changeColorsCheckbox = document.getElementById("cc");
var alwaysCheckbox = document.getElementById("always");

var foreBtn = document.getElementById("fore");
var backBtn = document.getElementById("back");
var linkBtn = document.getElementById("link");
var clearBtn = document.getElementById("clear-storage");

var foreSwatch = document.getElementById("fore-swatch");
var backSwatch = document.getElementById("back-swatch");
var linkSwatch = document.getElementById("link-swatch");

changeColorsCheckbox.onclick = () => {
  sendRuntimeMessage('changeColors', changeColorsCheckbox.checked);
};

alwaysCheckbox.onclick = () => {
  sendRuntimeMessage('always', alwaysCheckbox.checked);
};

alwaysCheckbox.onmouseover = function () {
  if (!state.activeTabId) {
    return;
  }
  infoText.textContent = `Always change colors on host: ${state.activeTabHostname}`;
  info.style.opacity = 1;
}

alwaysCheckbox.onmouseout = function () {
  info.style.opacity = 0;
}

clearBtn.onclick = function () {
  sendRuntimeMessage('resetState');
}

function handleFore() {
  saveStorage({ activeBtn: 'fore', lightness: state.fg.lightness });
}
function handleBack() {
  saveStorage({ activeBtn: 'back', lightness: state.bg.lightness });
}
function handleLink() {
  saveStorage({ activeBtn: 'link', lightness: state.li.lightness });
}

foreSwatch.onclick = handleFore;
foreBtn.onclick = handleFore;
backSwatch.onclick = handleBack;
backBtn.onclick = handleBack;
linkSwatch.onclick = handleLink;
linkBtn.onclick = handleLink;

function setActiveColorButton() {
  foreBtn.classList.remove("active-btn");
  backBtn.classList.remove("active-btn");
  linkBtn.classList.remove("active-btn");
  document.getElementById(state.activeBtn).classList.add("active-btn");

  foreSwatch.classList.remove("active-swatch");
  backSwatch.classList.remove("active-swatch");
  linkSwatch.classList.remove("active-swatch");
  document.getElementById(`${state.activeBtn}-swatch`).classList.add("active-swatch");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Canvas
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
canvas.width = document.querySelector("canvas").offsetWidth;
canvas.height = document.querySelector("canvas").offsetHeight;
var canvasHeight = document.querySelector("canvas").offsetHeight;

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

function toRads(degrees) {
  return degrees * (Math.PI / 180);
}

function drawCanvas() {
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
  hoverId === "zero" ? ctx.lineWidth = strokeHoverWidth : ctx.lineWidth = 1;

  if (
    (state.activeBtn === "fore" && state.fg.chosenId === "zero") ||
    (state.activeBtn === "back" && state.bg.chosenId === "zero") ||
    (state.activeBtn === "link" && state.li.chosenId === "zero")) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = strokeHoverWidth;
    ctx.setLineDash([5, 2]);
  }
  ctx.stroke();
  ctx.setLineDash([0]);

  if (swatches["zero"]) {
    updateSwatch(swatches["zero"], 0, 0, state.lightness);
  } else {
    swatches["zero"] = new Swatch(zeroSatOffsetX, zeroSatOffsetY, "zero", satRadius, 0, 0, state.lightness);
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
        updateSwatch(swatches[id], hue, saturation, state.lightness);
      } else {
        swatches[id] = new Swatch(x, y, id, littleRadius, hue, saturation, state.lightness);
      }

      ctx.strokeStyle = strokeColor;
      hoverId === id ? ctx.lineWidth = strokeHoverWidth : ctx.lineWidth = 1;

      if ((state.activeBtn === "fore" && state.fg.chosenId === id) ||
        (state.activeBtn === "back" && state.bg.chosenId === id) ||
        (state.activeBtn === "link" && state.li.chosenId === id)) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = strokeHoverWidth;
        ctx.setLineDash([5, 2]);
      }
      ctx.stroke();
      ctx.setLineDash([0]);
    }
  }

  if (hoverId) {
    ctx.beginPath();
    ctx.arc(originX, originY, bigRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = swatches[hoverId].hsl;
    ctx.fill();
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }
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
  sendRuntimeMessage('updateChosenColor', swatch);
}

canvas.onmouseout = function () {
  hoverId = null;
  drawCanvas();
}

canvas.onmousemove = function (e) {
  var swatch = checkCollision(swatches, e.offsetX, e.offsetY);

  if (swatch) {
    hoverId = swatch.id;

    drawCanvas();

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

function saveStorage(obj, response) {
  response = response || (() => {});
  if (bIsChrome) {
    chrome.storage.local.set({ ...obj }, response);
  } else {
    browser.storage.local.set({ ...obj }, response);
  }
}

function getStorage(obj, response) {
  response = response || (() => { });
  if (bIsChrome) {
    chrome.storage.local.get(obj, response);
  } else {
    browser.storage.local.get(obj, response);
  }
}

function updateUi() {
  getStorage(null, theState => {
    state = theState;
    foreSwatch.style.background = state.fg.hsl;
    backSwatch.style.background = state.bg.hsl;
    linkSwatch.style.background = state.li.hsl;

    changeColorsCheckbox.checked = state.changeColors;
    alwaysCheckbox.checked = state.always;
    lightnessSlider.value = state.lightness;
    lightnessValue.childNodes[0].nodeValue = `${state.lightness}%`;

    setActiveColorButton();
    drawCanvas();
  });
}

function sendRuntimeMessage(message, payload, response) {
  if (bIsChrome) {
    chrome.runtime.sendMessage({ message, payload }, response);
  } else {
    browser.runtime.sendMessage({ message, payload }, response);
  }
}

if (bIsChrome) {
  chrome.storage.onChanged.addListener(updateUi);
} else {
  browser.storage.onChanged.addListener(updateUi);
}

window.onload = updateUi;
