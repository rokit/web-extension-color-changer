var state = null;

function change_colors() {
	if (!state) return;

	document.body.style.background = state.bg.hsl;
	
	var all = document.getElementsByTagName("*");
	for (var i = 0; i < all.length; i++) {
		if (all[i].tagName !== "IMG") {
			all[i].style.background = state.bg.hsl;
			all[i].style.color = state.fg.hsl;
			all[i].style.borderColor = state.bg.hsl;
		}
	}
	
	// var blocks = document.querySelectorAll('section, header, footer, nav');
	// for (var i = 0; i < blocks.length; i++) {
	// 	blocks[i].style.background = state.bg.hsl_darker;
	// }

	var buttons = document.querySelectorAll('button');
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].style.background = state.bg.hsl_lighter;
		buttons[i].style.color = state.li.hsl;
	}

	var inputs = document.querySelectorAll('input, textarea, pre, code, code span');
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].style.background = state.bg.hsl_lighter;
	}

	var anchors = document.querySelectorAll('a, a *');
	for (var i = 0; i < anchors.length; i++) {
		// anchors[i].style.background = state.bg.hsl;
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
	if (msg.state) {
		state = msg.state;
		change_colors();
	}
}

async function init() {
	for (let i = 0; i < state.urls.length; i++) {
		let url = state.urls[i];
		if (compare_urls(url, location.href)) {
			change_colors();
			// some sites take a long time to load, so change colors again
			setTimeout(change_colors, 1000);
			return;
		}
	}
}

function compare_urls(aa, bb) {
	let a = new URL(aa);
	let b = new URL(bb);

	if (a.hostname === b.hostname) {
		return true;
	}
	return false;
}

function first_run() {
	if (window.hasRun) {
		return;
	}
	
	chrome.storage.local.get('state', function(result) {
		if (result.state.lightness) {
			state = result.state;
			init();
		} else {
			return;
		}
	});
	
	window.hasRun = true;
	chrome.runtime.onMessage.addListener(notify);
}

first_run();
// var interval = setInterval(change_colors, 1000);