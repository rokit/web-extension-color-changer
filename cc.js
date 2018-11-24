
var bIsChanged = false;

var bg_alpha = `33`;
var bg_color = `#333333`;
var input_bg_color = `#444444`;
var zero_alpha = `00`;
var full_alpha = `FF`;
var anchor_color = `#9BC2E3`;
var anchor_bg_color = `#000000`;
var font_color = `#CCCCCC`;

var settings = {};

function revert() {
	window.location.reload(true); 
}

function change_colors(fg, bg, li) {
	document.body.style.background = bg.hsl;
	
	var all = document.getElementsByTagName("*");
	for (var i = 0; i < all.length; i++) {
		all[i].style.background = bg.hsl;
		all[i].style.color = fg.hsl;
		all[i].style.borderColor = bg.hsl;
	}
	
	var blocks = document.querySelectorAll('section, header, footer, nav');
	for (var i = 0; i < blocks.length; i++) {
		blocks[i].style.background = bg.darker;
	}

	var buttons = document.querySelectorAll('button');
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].style.background = bg.lighter;
		buttons[i].style.color = li.hsl;
	}

	var inputs = document.querySelectorAll('input, textarea, pre, code, code span');
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].style.background = bg.lighter;
	}

	var anchors = document.querySelectorAll('a');
	for (var i = 0; i < anchors.length; i++) {
		// anchors[i].style.background = bg.hsl;
		anchors[i].style.color = li.hsl;
		anchors[i].onmouseover = function() {
			this.style.color = li.lighter;
		}
		anchors[i].onmouseout = function() {
			this.style.color = li.hsl;
		}
		anchors[i].onclick = function() {
			this.style.color = li.darker;
		}
	}

	bIsChanged = true;
}

function notify(msg){
	// console.log(msg);
	if (msg.settings) {
		change_colors(msg.settings.fg, msg.settings.bg, msg.settings.li);
	}
	if (msg.test) {
		// console.log(msg.test);
	}
}

async function init(result) {

	if (result.settings) {
		settings = result.settings;
	} else {
		return;
	}

	// console.log(settings);
	for (let i = 0; i < settings.urls.length; i++) {
		let url = settings.urls[i].url;
		let type = settings.urls[i].type;
		if (compare_urls(url, location.href, type)) {
			// console.log("changing colors: ");
			// console.log(url);
			// console.log(location.href);
			// console.log(type);
			change_colors(settings.fg, settings.bg, settings.li);
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
			if (settings.domain_re.exec(a.hostname)[0] === settings.domain_re.exec(b.hostname)[0]) {
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

	// browser.storage.local.clear();

	var getting = browser.storage.local.get("settings");
	getting.then(init, on_init_error);

	window.hasRun = true;
	browser.runtime.onMessage.addListener(notify);
}

// first_run();

setTimeout(first_run, 1000);