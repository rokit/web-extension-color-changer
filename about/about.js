var imgURL = chrome.extension.getURL("icons/icon.svg");
var icon = document.getElementById('icon');
icon.src = `${imgURL}`;