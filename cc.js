var domain_re = /[a-zA-Z0-9]{1,61}\.[a-zA-Z]{2,}$/;
var state = {};

function change_colors() {
	let styles =
	`
		* {
			background: ${state.bg.hsl} !important;
			color: ${state.fg.hsl} !important;
		}
		
		a, a * {
			color: ${state.li.hsl} !important;
		}
	`;

	console.log("whoa");
	let ccl = document.getElementById("color-changer-link");
	if (ccl) {
		ccl.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent(styles));
	} else {
		ccl = this.document.createElement('link');
		ccl.setAttribute('rel', 'stylesheet');
		ccl.setAttribute('type', 'text/css');
		ccl.setAttribute('id', 'color-changer-link-' + new Date().getMilliseconds());
		ccl.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent(styles));
		document.head.appendChild(ccl);
	}
	ccl.href = ccl.href + "?id=" + new Date().getMilliseconds();

	// document.body.style.background = state.bg.hsl;
	
	// var all = document.getElementsByTagName("*");
	// for (var i = 0; i < all.length; i++) {
	// 	if (all[i].tagName !== "IMG") {
	// 		all[i].style.background = state.bg.hsl;
	// 		all[i].style.color = state.fg.hsl;
	// 		all[i].style.borderColor = state.bg.hsl;
	// 	}
	// }
	
	// var blocks = document.querySelectorAll('section, header, footer, nav');
	// for (var i = 0; i < blocks.length; i++) {
	// 	blocks[i].style.background = state.bg.hsl_darker;
	// }

	// var buttons = document.querySelectorAll('button');
	// for (var i = 0; i < buttons.length; i++) {
	// 	buttons[i].style.background = state.bg.hsl_lighter;
	// 	buttons[i].style.color = state.li.hsl;
	// }

	// var inputs = document.querySelectorAll('input, textarea, pre, code, code span');
	// for (var i = 0; i < inputs.length; i++) {
	// 	inputs[i].style.background = state.bg.hsl_lighter;
	// }

	// var anchors = document.querySelectorAll('a, a *');
	// for (var i = 0; i < anchors.length; i++) {
	// 	// anchors[i].style.background = state.bg.hsl;
	// 	anchors[i].style.color = state.li.hsl;
	// 	anchors[i].onmouseover = function() {
	// 		this.style.color = state.li.hsl_shift;
	// 	}
	// 	anchors[i].onmouseout = function() {
	// 		this.style.color = state.li.hsl;
	// 	}
	// 	anchors[i].onclick = function() {
	// 		this.style.color = state.li.hsl_darker;
	// 	}
	// }
}

function notify(msg){
	console.log("notify msg");
	if (msg.state) {
		change_colors(msg.state);
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
			change_colors();
			return;
		}
	}
}

function compare_urls(aa, bb, type) {
	let a = new URL(aa);
	let b = new URL(bb);

	switch(type) {
		case "page": {
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
			if (domain_re.exec(a.hostname)[0] === domain_re.exec(b.hostname)[0]) {
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

// browser.storage.local.clear();
first_run();

// var interval = setInterval(change_colors, 1000);