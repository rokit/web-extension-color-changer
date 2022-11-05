const urlParams = new URLSearchParams(window.location.search);
const reason = urlParams.get('reason');

const icon = <HTMLImageElement>document.getElementById('icon')!;
const greeting = document.getElementById('greeting')!;

// set image src from web_accessible_resources
icon.src = chrome.extension.getURL("icons/icon.svg");

// set greeting
switch (reason) {
  case 'install': break; // already in the markup
  case 'update': greeting.textContent = 'Color Changer has been updated! Your browser may have done this automatically.'; break;
  default: break;
}
