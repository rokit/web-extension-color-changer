var bIsChrome = /Chrome/.test(navigator.userAgent);
var activeTabId = null;

function ChosenColor(hue, saturation, lightness, chosenId) {
  this.hue = hue;
  this.saturation = saturation;
  this.lightness = lightness;
  this.chosenId = chosenId;
  createStrings(this);
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

var changeColors = false;

var lightnessSlider = document.getElementById("lightness");
var lightnessValue = document.getElementById("lightness-value");

lightnessSlider.oninput = function() {
  lightnessValue.childNodes[0].nodeValue = `${this.value}%`;
  state.lightness = parseInt(this.value);
  
  drawCanvas();
}

var info = document.getElementById("info");
var info_text = document.querySelector("#info p");

var ccBtn = document.getElementById("cc");
var ccAlwaysBtn = document.getElementById("cc-always");
var ccNeverBtn = document.getElementById("cc-never");
var clearBtn = document.getElementById("clear-storage");

var foreBtn = document.getElementById("fore");
var backBtn = document.getElementById("back");
var linkBtn = document.getElementById("link");

var foreSwatch = document.getElementById("fore-swatch");
var backSwatch = document.getElementById("back-swatch");
var linkSwatch = document.getElementById("link-swatch");

ccBtn.onclick = function() {
  toggleChangeColors();
  // changeColors = !changeColors;
  // setButtonActive(ccBtn, changeColors);
};

ccAlwaysBtn.onclick = function() {
  if (bIsChrome) {
    chrome.runtime.sendMessage({handle_cc_always_btn: state});
  } else {
    browser.runtime.sendMessage({handle_cc_always_btn: state});
  }
};

ccAlwaysBtn.onmouseover = function() {
  if (!activeTabId) {
    return;
  }
  // let url = new URL(activeTabId);
  // info_text.textContent = `Always change pages on host: ${url.hostname}`;
  // info.style.opacity = 1;
}

ccAlwaysBtn.onmouseout = function() {
  info.style.opacity = 0;
}

ccNeverBtn.onclick = function() {
  if (bIsChrome) {
    chrome.runtime.sendMessage({handle_cc_never_btn: state});
  } else {
    browser.runtime.sendMessage({handle_cc_never_btn: state});
  }
};

ccNeverBtn.onmouseover = function() {
  if (!activeTabId) {
    return;
  }
  // let url = new URL(activeTabId.url);
  // info_text.textContent = `Never change pages on host: ${url.hostname}`;
  // info.style.opacity = 1;
}

ccNeverBtn.onmouseout = function() {
  info.style.opacity = 0;
}

clearBtn.onclick = function() {
  if (bIsChrome) {
    chrome.runtime.sendMessage({handle_clear_btn: state});
  } else {
    browser.runtime.sendMessage({handle_clear_btn: state});
  }
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

function setButtonActive(btn, bActive) {
  var check = " 🗸";
  if (bActive) {
    btn.classList.add("active-btn");
    btn.textContent = btn.dataset.value + check;
  } else {
    btn.classList.remove("active-btn");
    btn.textContent = btn.dataset.value;
  }
}

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
  return degrees * (Math.PI/180);
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

      if (	(state.activeBtn === "fore" && state.fg.chosenId === id) ||
            (state.activeBtn === "back" && state.bg.chosenId === id) ||
            (state.activeBtn === "link" && state.li.chosenId === id)	) {
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

canvas.onclick = function(e) {
  var swatch = checkCollision(swatches, e.offsetX, e.offsetY);

  switch(state.activeBtn) {
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
  // updateContextMenuItem("change_colors", state.cc_toggle);
}

canvas.onmouseout = function() {
  hoverId = null;
  drawCanvas();
}

canvas.onmousemove = function(e) {
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

function initState() {
  console.log('init state called');
  if (!state.fg) state.fg = new ChosenColor(0,  0, 80,  "zero");
  if (!state.bg) state.bg = new ChosenColor(0,  0, 25,  "zero");
  if (!state.li) state.li = new ChosenColor(68, 80, 80, "2-6");

  if (!state.urls) {
    state.urls = [];
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
  //   setButtonActive(ccAlwaysBtn, bAlways);
  //   setButtonActive(ccNeverBtn, !bAlways);
  // } else {
  //   setButtonActive(ccAlwaysBtn, false);
  //   setButtonActive(ccNeverBtn, false);
  // }

  // function getCcBtnStateResponse(value) {
  //   console.log('getCcBtnStateResponse', value);
  //   state.cc_toggle = value;
  //   setButtonActive(ccBtn, state.cc_toggle);
  // }

  // if (state.activeTabId) {
  //   if (bIsChrome) {
  //     console.log('init state getCcBtnState');
  //     chrome.tabs.sendMessage(state.activeTabId.id, {getCcBtnState: true}, getCcBtnStateResponse);
  //   } else {
  //     browser.tabs.sendMessage(state.activeTabId.id, {getCcBtnState: true}, getCcBtnStateResponse);
  //   }
  // }

  updateColorButtons();
}

async function toggleChangeColors() {
  function response(value) {
    setButtonActive(ccBtn, value);
  }

  let tabInfo = await readStorage('tabInfo');
  activeTabId = tabInfo.tabId;
  console.log('tabInfo', tabInfo);

  if (activeTabId) {
    if (bIsChrome) {
      console.log('toggleChangeColors');
      chrome.tabs.sendMessage(activeTabId, {message: 'toggleChangeColors'}, response);
    } else {
      browser.tabs.sendMessage(activeTabId, {message: 'toggleChangeColors'}, response);
    }
  }
}

function readStorage(key) {
  return new Promise((resolve, reject) => {
    if (bIsChrome) {
      chrome.storage.local.get(key, function(result) {
        if (result != undefined) {
            resolve(result);
        } else {
            reject(null);
        }
      });
    } else {
      browser.storage.local.get(key, function(result) {
        if (result != undefined) {
            resolve(result);
        } else {
            reject(null);
        }
      });
    }
  });
}

function getTabIdFromStorage() {
  function res(result) {
    console.log('result', result);
    activeTabId = result.tabInfo.tabId;
  }
  chrome.storage.local.get(['tabInfo'], res);
}

function saveState() {
  if (bIsChrome) {
    chrome.storage.local.set({state});
  } else {
    browser.storage.local.set({state});
  }
}

function getState() {
  function getStateCallback(res) {
    state = res.state;
    initState();
    updateUi();
  }

  if (bIsChrome) {
    chrome.storage.local.get("state", getStateCallback);
  } else {
    browser.storage.local.get("state", getStateCallback);
  }
}

function notify(req){
  switch (req.message) {
    case 'changeColors': {
      console.log('ccreq', req);
      setButtonActive(ccBtn, req.changeColors)
    }; break;
    case 'tabActivated': {
      getTabIdFromStorage();
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