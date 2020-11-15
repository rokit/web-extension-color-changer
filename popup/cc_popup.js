var bIsChrome = /Chrome/.test(navigator.userAgent);
var activeTabId = null;
var currentTabHostname = null;

function ChosenColor(hue, saturation, lightness, chosenId) {
  this.hue = hue;
  this.saturation = saturation;
  this.lightness = lightness;
  this.chosenId = chosenId;
  createStrings(this);
}

function CcHost(hostname, bAlways) {
  this.hostname = hostname;
  this.always = bAlways;
}

function updateChosenColor(color, hue, saturation, lightness, chosenId) {
  color.hue = hue;
  color.saturation = saturation;
  color.lightness = lightness;
  color.chosenId = chosenId;
  createStrings(color);
}

function createStrings(color) {
  color.hsl = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
  if (color.lightness >= 50) {
    color.lightness_shift = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness - 10}%)`;
  } else {
    color.lightness_shift = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness + 10}%)`;
  }
  color.hue_hovered = `hsl(${color.hue + 40 % 360}, ${color.saturation + 20}%, ${color.lightness}%)`;
  color.hue_visited = `hsl(${color.hue - 40 % 360}, ${color.saturation + 20}%, ${color.lightness}%)`;
  color.alpha = `hsla(${color.hue}, ${color.saturation}%, ${color.lightness}%, 0.5)`;
}

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

var state = {};

var lightnessSlider = document.getElementById("lightness");
var lightnessValue = document.getElementById("lightness-value");

lightnessSlider.oninput = function () {
  lightnessValue.childNodes[0].nodeValue = `${this.value}%`;
  state.lightness = parseInt(this.value);

  drawCanvas();
}

var info = document.getElementById("info");
var infoText = document.querySelector("#info p");

var ccCheckbox = document.getElementById("cc");
var alwaysCheckbox = document.getElementById("always");

var foreBtn = document.getElementById("fore");
var backBtn = document.getElementById("back");
var linkBtn = document.getElementById("link");
var clearBtn = document.getElementById("clear-storage");

var foreSwatch = document.getElementById("fore-swatch");
var backSwatch = document.getElementById("back-swatch");
var linkSwatch = document.getElementById("link-swatch");

ccCheckbox.onclick = async () => {
  if (!ccCheckbox.checked && alwaysCheckbox.checked) {
    currentTabHostname = (await getStorageValue('currentTabHostname')).currentTabHostname;
    if (!currentTabHostname) return;

    let index = state.hosts.map(ccHost => ccHost.hostname).indexOf(currentTabHostname);
    if (index > -1) {
      // if always not checked and host is present
      state.hosts.splice(index, 1);
    }
    alwaysCheckbox.checked = false;
    saveState();
  }
  setChangeColors(ccCheckbox.checked);
};

alwaysCheckbox.onclick = async function () {
  currentTabHostname = (await getStorageValue('currentTabHostname')).currentTabHostname;
  if (!currentTabHostname) return;

  let index = state.hosts.map(ccHost => ccHost.hostname).indexOf(currentTabHostname);

  if (alwaysCheckbox.checked && index === -1) {
    // if checked and host not present
    let host = new CcHost(currentTabHostname, true);
    state.hosts.push(host);
  } else if (!alwaysCheckbox.checked && index > -1) {
    // if not checked and host is present
    state.hosts.splice(index, 1);
  }

  if (alwaysCheckbox.checked && !ccCheckbox.checked) {
    ccCheckbox.checked = true;
    setChangeColors(true);
  }

  saveState();
};

alwaysCheckbox.onmouseover = function () {
  if (!activeTabId) {
    return;
  }
  // let url = new URL(activeTabId);
  // infoText.textContent = `Always change pages on host: ${url.hostname}`;
  // info.style.opacity = 1;
}

alwaysCheckbox.onmouseout = function () {
  info.style.opacity = 0;
}

clearBtn.onclick = function () {
  state.fg = null
  state.bg = null
  state.li = null;
  state.hosts = null;
  state.activeBtn = null;
  alwaysCheckbox.checked = false;
  initState();
  saveState();
  updateUi();
  updateContent();
}

function updateColorButtons() {
  lightnessSlider.value = state.lightness;
  lightnessValue.childNodes[0].nodeValue = `${state.lightness}%`;
  drawCanvas();
  setActiveColorButton();
}

function handleFore() {
  state.activeBtn = "fore";
  state.lightness = state.fg.lightness;
  updateColorButtons();
}
function handleBack() {
  state.activeBtn = "back";
  state.lightness = state.bg.lightness;
  updateColorButtons();
}
function handleLink() {
  state.activeBtn = "link";
  state.lightness = state.li.lightness;
  updateColorButtons();
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
  setActiveSwatchButton();
}

function setActiveSwatchButton() {
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

      let = id = `${j}-${i}`;

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
  return false;
}

canvas.onclick = function (e) {
  var swatch = checkCollision(swatches, e.offsetX, e.offsetY);

  switch (state.activeBtn) {
    case "fore": {
      updateChosenColor(state.fg, swatch.hue, swatch.saturation, swatch.lightness, swatch.id);
    } break;
    case "back": {
      updateChosenColor(state.bg, swatch.hue, swatch.saturation, swatch.lightness, swatch.id);
    } break;
    case "link": {
      updateChosenColor(state.li, swatch.hue, swatch.saturation, swatch.lightness, swatch.id);
    } break;
    default: break;
  }

  saveState();
  updateUi();
  updateContentViaSwatch();
  // updateContextMenuItem("change_colors", state.cc_toggle);
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

function updateContent() {
  if (activeTabId) {
    if (bIsChrome) {
      chrome.tabs.sendMessage(activeTabId, { message: 'updateContent' });
    } else {
      browser.tabs.sendMessage(activeTabId, { message: 'updateContent' });
    }
  }
}

function updateContentViaSwatch() {
  if (activeTabId) {
    ccCheckbox.checked = true;
    if (bIsChrome) {
      chrome.tabs.sendMessage(activeTabId, { message: 'setChangeColors', value: true });
    } else {
      browser.tabs.sendMessage(activeTabId, { message: 'setChangeColors', value: true });
    }
  }
}

function initState() {
  console.log('init state called');
  if (!state.fg) state.fg = new ChosenColor(0, 0, 80, "zero");
  if (!state.bg) state.bg = new ChosenColor(0, 0, 25, "zero");
  if (!state.li) state.li = new ChosenColor(68, 80, 80, "2-6");

  if (!state.hosts) {
    state.hosts = [];
  }

  if (!state.activeBtn) state.activeBtn = "fore";
  switch (state.activeBtn) {
    case "fore": state.lightness = state.fg.lightness; break;
    case "back": state.lightness = state.bg.lightness; break;
    case "link": state.lightness = state.li.lightness; break;
  }
}

function updateUi() {
  foreSwatch.style.background = state.fg.hsl;
  backSwatch.style.background = state.bg.hsl;
  linkSwatch.style.background = state.li.hsl;

  // if (state.url_index > -1) {
  //   let bAlways = state.urls[state.url_index].always;
  // } else {
  // }

  // function getCcBtnStateResponse(value) {
  //   console.log('getCcBtnStateResponse', value);
  //   state.cc_toggle = value;
  // }

  // if (state.activeTabId) {
  //   if (bIsChrome) {
  //     console.log('init state getCcBtnState');
  //     chrome.tabs.sendMessage(state.activeTabId.id, {getCcBtnState: true}, getCcBtnStateResponse);
  //   } else {
  //     browser.tabs.sendMessage(state.activeTabId.id, {getCcBtnState: true}, getCcBtnStateResponse);
  //   }
  // }

  // also calls drawCanvas
  updateColorButtons();
}

async function setChangeColors(value) {
  if (activeTabId) {
    if (bIsChrome) {
      chrome.tabs.sendMessage(activeTabId, { message: 'setChangeColors', value });
    } else {
      browser.tabs.sendMessage(activeTabId, { message: 'setChangeColors', value });
    }
  }
}

function getStorageValue(key) {
  return new Promise((resolve, reject) => {
    if (bIsChrome) {
      chrome.storage.local.get(key, function (result) {
        if (result != undefined) {
          resolve(result);
        } else {
          reject(null);
        }
      });
    } else {
      browser.storage.local.get(key, function (result) {
        if (result != undefined) {
          resolve(result);
        } else {
          reject(null);
        }
      });
    }
  });
}

function saveState() {
  if (bIsChrome) {
    chrome.storage.local.set({ state });
  } else {
    browser.storage.local.set({ state });
  }
}

async function getState() {
  async function getChangeColorsResponse(value) {
    ccCheckbox.checked = value;
    currentTabHostname = (await getStorageValue('currentTabHostname')).currentTabHostname;
    state = (await getStorageValue('state')).state;
    let index = state.hosts.map(ccHost => ccHost.hostname).indexOf(currentTabHostname);

    if (index > -1) {
      ccCheckbox.checked = true;
      alwaysCheckbox.checked = true;
    }

    initState();
    updateUi();
  }

  activeTabId = (await getStorageValue('tabInfo')).tabInfo.tabId;
  if (activeTabId) {
    if (bIsChrome) {
      chrome.tabs.sendMessage(activeTabId, { message: 'getChangeColors' }, getChangeColorsResponse);
    } else {
      browser.tabs.sendMessage(activeTabId, { message: 'getChangeColors' }, getChangeColorsResponse);
    }
  }
}

function notify(req) {
  switch (req.message) {
    case 'changeColors': {
    }; break;
    default: break;
  }
}

window.onload = getState;

if (bIsChrome) {
  chrome.runtime.onMessage.addListener(notify);
} else {
  browser.runtime.onMessage.addListener(notify);
}