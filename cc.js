
var bIsChanged = false;

var bg_alpha = `33`;
var bg_color = `#333333`;
var input_bg_color = `#444444`;
var zero_alpha = `00`;
var full_alpha = `FF`;
var anchor_color = `#9BC2E3`;
var anchor_bg_color = `#000000`;
var font_color = `#CCCCCC`;

var state = {};

function revert() {
	window.location.reload(true); 
}

function change_colors(state) {
	document.body.style.background = state.bg.hsl;
	
	var all = document.getElementsByTagName("*");
	for (var i = 0; i < all.length; i++) {
		all[i].style.background = state.bg.hsl;
		all[i].style.color = state.fg.hsl;
		all[i].style.borderColor = state.bg.hsl;
	}
	
	var blocks = document.querySelectorAll('section, header, footer, nav');
	for (var i = 0; i < blocks.length; i++) {
		blocks[i].style.background = state.bg.hsl_darker;
	}

	var buttons = document.querySelectorAll('button');
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].style.background = state.bg.hsl_lighter;
		buttons[i].style.color = state.li.hsl;
	}

	var inputs = document.querySelectorAll('input, textarea, pre, code, code span');
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].style.background = state.bg.hsl_lighter;
	}

	var anchors = document.querySelectorAll('a');
	for (var i = 0; i < anchors.length; i++) {
		// anchors[i].style.background = state.bg.hsl;
		anchors[i].style.color = state.li.hsl;
		anchors[i].onmouseover = function() {
			this.style.color = state.li.hsl_lighter;
		}
		anchors[i].onmouseout = function() {
			this.style.color = state.li.hsl;
		}
		anchors[i].onclick = function() {
			this.style.color = state.li.hsl_darker;
		}
	}

	bIsChanged = true;
}

function notify(msg){
	// console.log(msg);
	if (msg.state) {
		change_colors(msg.state);
	}
	if (msg.test) {
		// console.log(msg.test);
	}
}

async function init(storage) {

	if (storage.state) {
		state = storage.state;
	} else {
		return;
	}

	// console.log(state);
	for (let i = 0; i < state.urls.length; i++) {
		let url = state.urls[i].url;
		let type = state.urls[i].type;
		if (compare_urls(url, location.href, type)) {
			// console.log("changing colors: ");
			// console.log(url);
			// console.log(location.href);
			// console.log(type);
			change_colors(state.fg, state.bg, state.li);
			return;
		}
	}
}

function compare_urls(aa, bb, type) {
	// console.log(aa);
	// console.log(bb);
	let a = new URL(aa);
	let b = new URL(bb);

	switch(type) {
		case "page": {
			// console.log(a.href);
			// console.log(b.href);		
			if (a.href === b.href) {
				return true;
			}
		} break;
		case "subdomain": {
			if (a.hostname === b.hostname) {
				return true;
			}
		} break;
		case "domain": {
			if (state.domain_re.exec(a.hostname)[0] === state.domain_re.exec(b.hostname)[0]) {
				return true;
			}
		} break;
		default: return false;
	}
}

function on_init_error(error) {
	console.log(`Error: ${error}`);
}

function first_run() {
	if (window.hasRun) {
		return;
	}

	
	var getting = browser.storage.local.get("state");
	getting.then(init, on_init_error);
	
	window.hasRun = true;
	browser.runtime.onMessage.addListener(notify);
}

browser.storage.local.clear();
// first_run();

setTimeout(first_run, 1000);