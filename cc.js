var bIsChrome = /Chrome/.test(navigator.userAgent);

var state = null;

function change_colors() {
	if (!state) return;
	
	var all = document.getElementsByTagName("*");
	for (var i = 0; i < all.length; i++) {
		if (all[i].tagName !== "IMG") {
			all[i].style.backgroundColor = state.bg.hsl;
			all[i].style.color = state.fg.hsl;
			all[i].style.borderColor = state.bg.hsl_lighter;
		}
	}
	
	// var blocks = document.querySelectorAll('section, header, footer, nav');
	// for (var i = 0; i < blocks.length; i++) {
	// 	blocks[i].style.background = state.bg.hsl_darker;
	// }

	var buttons = document.querySelectorAll('button');
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].style.backgroundColor = state.bg.hsl_lighter;
		buttons[i].style.color = state.li.hsl;
	}

	var inputs = document.querySelectorAll('input, textarea, pre, code, code span');
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].style.backgroundColor = state.bg.hsl_lighter;
	}

	var anchors = document.querySelectorAll('a, a *');
	for (var i = 0; i < anchors.length; i++) {
		anchors[i].style.backgroundColor = state.bg.hsl;
		anchors[i].style.color = state.li.hsl;
		anchors[i].onmouseover = function() {
			this.style.color = state.li.hsl_shift;
		}
		anchors[i].onmouseout = function() {
			this.style.color = state.li.hsl;
		}
		anchors[i].onclick = function() {
			this.style.color = state.li.hsl_darker;
		}
	}
}

function notify(msg){
	if (msg.content_state) {
		state = msg.content_state;
		if (state.always_on) {
			change_colors();
			setTimeout(change_colors, 1000);
		}		
	}
	else if (msg.content_change) {
		state = msg.content_change;
		change_colors();
		setTimeout(change_colors, 1000);
	}
	// else if (msg.tab_activated) {
	// 	state = msg.tab_activated;
	// 	if (state.always_on) {
	// 		change_colors();
	// 	}
	// }
}

function get_state() {
	if (bIsChrome) {
		chrome.runtime.sendMessage({content_request_state: true});
	} else {
		browser.runtime.sendMessage({content_request_state: true});
	}
}

if (bIsChrome) {
	chrome.runtime.onMessage.addListener(notify);
} else {
	browser.runtime.onMessage.addListener(notify);
}
window.onload = get_state;
// var interval = setInterval(change_colors, 1000);