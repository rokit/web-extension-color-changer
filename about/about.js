var bIsChrome = /Chrome/.test(navigator.userAgent);
var imgUrl;
if (bIsChrome) {
  imgUrl = chrome.extension.getURL("icons/icon.svg");
} else {
  imgUrl = browser.extension.getURL("icons/icon.svg");
}
var icon = document.getElementById('icon');
icon.src = imgUrl;