import * as c from "../constants";
import { State } from "../interfaces";
import { runtimeSendMessage, shouldChangeColors } from "../utils";

var canvas = <HTMLCanvasElement>document.getElementById("cc-canvas")!;
var ctx = canvas.getContext("2d")!;

let changeColorsCheckbox = <HTMLInputElement>document.getElementById("change-colors")!;
let changeColorsLabel = <HTMLInputElement>document.getElementById("change-colors-label")!;

let foreBtn = document.getElementById(c.FORE_BTN)!;
let backBtn = document.getElementById(c.BACK_BTN)!;
let linkBtn = document.getElementById(c.LINK_BTN)!;
let resetBtn = document.getElementById("reset")!;

let foreSwatch = document.getElementById(`${c.FORE_BTN}-swatch`)!;
let backSwatch = document.getElementById(`${c.BACK_BTN}-swatch`)!;
let linkSwatch = document.getElementById(`${c.LINK_BTN}-swatch`)!;

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

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Canvas
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

async function updateUi() {
  let state: State = await runtimeSendMessage({ message: c.GET_STATE });

  foreSwatch.style.background = state.fg.hsl;
  backSwatch.style.background = state.bg.hsl;
  linkSwatch.style.background = state.li.hsl;

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
  drawCanvas(state);
}

chrome.storage.onChanged.addListener(updateUi);

window.onload = updateUi;
