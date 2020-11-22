const bIsChrome = /Chrome/.test(navigator.userAgent);
const urlParams = new URLSearchParams(window.location.search);
const reason = urlParams.get('reason');

const icon = document.getElementById('icon');
const greeting = document.getElementById('greeting');

// set image src from web_accessible_resources
let imgUrl = "";
if (bIsChrome) {
  imgUrl = chrome.extension.getURL("icons/icon.svg");
} else {
  imgUrl = browser.extension.getURL("icons/icon.svg");
}
icon.src = imgUrl;

// set greeting
switch (reason) {
  case 'install': break; // already in the markup
  case 'update': greeting.textContent = 'Thanks for updating Color Changer! (Your browser may have done this automatically)'; break;
  default: break;
}
