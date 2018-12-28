var bIsChrome = /Chrome/.test(navigator.userAgent);

function ChosenColor (hue, saturation, lightness, chosen_id) {
	this.hue = hue;
	this.saturation = saturation;
	this.lightness = lightness;
	this.chosen_id = chosen_id;

	this.hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	this.hsl_darker = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
	this.hsl_lighter = `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`;
	this.hsl_shift = `hsl(${hue + 40 % 360}, ${saturation}%, ${lightness}%)`;
	this.a_50 = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`;
}

var state = {};

function reload_tab() {
	if (bIsChrome) {
		chrome.tabs.reload(state.active_tab.id);
	} else {
		browser.tabs.reload(state.active_tab.id);
	}
}

async function add_url() {
	if (!state.active_tab) return;
	if (!state.active_tab.url) return;

	for (let i = 0; i < state.urls.length; i++) {
		if (compare_urls(state.urls[i], state.active_tab.url)) {
			// url already added
			return;
		}
	}

	// if no match was found, this is a new url
	state.urls.push(state.active_tab.url);
	await save_state();
}

async function remove_url() {
	if (!state.active_tab) return;
	if (!state.active_tab.url) return;

	let i = contains_url();
	if (i > -1) {
		state.urls.splice(i, 1);
		await save_state();
	}
}

// check if tab url is already in our list
function contains_url() {
	if (state.urls) {
		for (let i = 0; i < state.urls.length; i++) {
			if (compare_urls(state.urls[i], state.active_tab.url)) {
				return i;
			}
		}
		return -1;
	}
}

async function save_state() {
	if (bIsChrome) {
		chrome.storage.local.set({state: state});
	} else {
		browser.storage.local.set({state: state});
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

async function popup_subdomain_click() {
	if (contains_url() > -1) {
		state.subdomain_active = false;
		state.cc_toggle = false;
		await remove_url();
		reload_tab();
	} else {
		state.subdomain_active = true;
		await add_url();
		do_content_change();
	}
	if (bIsChrome) {
		chrome.runtime.sendMessage({popup_state: state});
	} else {
		browser.runtime.sendMessage({popup_state: state});
	}
}

function do_content_change() {
	if (state.active_tab) {
		if (bIsChrome) {
			chrome.tabs.sendMessage(state.active_tab.id, {content_change: state});
		} else {
			browser.tabs.sendMessage(state.active_tab.id, {content_change: state});
		}
	} else {
		console.log("no active tab");
	}
}

// callbackOne
function get_active_tab(callbackTwo) {
	console.log("getting active tab");
	function check_tabs(tabs) {
		if (tabs[0]) { // Sanity check
			state.active_tab = tabs[0];
		} else {
			state.active_tab = null;
		}
		if (contains_url() > -1) {
			state.subdomain_active = true;
			do_content_change();
		} else {
			state.subdomain_active = false;
		}

		if (callbackTwo) {
			callbackTwo();
		}
	}

	if (bIsChrome) {
		chrome.tabs.query({active: true, currentWindow: true}, check_tabs);
	} else {
		browser.tabs.query({active: true, currentWindow: true}, check_tabs);
	}
}

// getting local storage isn't synchronous, and neither is getting tabs.
// We need both of those before we can create the context menu.
// Chrome also doesn't implement promises for getting local storage or tabs.
// Therefore we do the wonky callback deal.
function get_state(callbackOne, callbackTwo) {
	console.log("getting state");
	
	function check_result(res) {
		if (res.state) {
			state = res.state;
		} else {
			state.fg = new ChosenColor(0,  0, 80,  "zero");
			state.bg = new ChosenColor(0,  0, 25,  "zero");
			state.li = new ChosenColor(68, 80, 80, "2-6");
			state.active_btn = "fore";
			state.urls = [];
			state.lightness = state.fg.lightness;
			state.cc_toggle = false;
			state.cc_toggle = false;
			// state.subdomain_active handled in get_active_tab
			// state.active_tab handled in get_active_tab
		}
		if (callbackOne) {
			if (callbackTwo) {
				callbackOne(callbackTwo);
			} else {
				callbackOne();
			}
		}
	}

	if (bIsChrome) {
		chrome.storage.local.get('state', check_result);
	} else {
		browser.storage.local.get('state', check_result);
	}
}

// callbackTwo
function setup_context_menu() {
	let addObject = {
		id: "add",
		title: "Add this subdomain",
		contexts: ["all"],
	};
	let removeObject = {
		id: "remove",
		title: "Remove this subdomain",
		contexts: ["all"],
	};

	if (bIsChrome) {
		chrome.contextMenus.create(removeObject, onCreated);
		chrome.contextMenus.create(addObject, onCreated);
	} else {
		browser.contextMenus.create(removeObject, onCreated);
		browser.contextMenus.create(addObject, onCreated);
	}
}

function popup_request_state() {
	function send() {
		chrome.runtime.sendMessage({popup_state: state});
	}
	get_state(get_active_tab, send);
}
function content_request_state() {
	get_state(get_active_tab, setup_context_menu);
}

function notify(msg){
	if (msg.popup_request_state) {
		console.log("script requested state", Date());
		popup_request_state();
	}
	else if (msg.content_request_state) {
		console.log("script requested state", Date());
		content_request_state();
	}
	else if (msg.save_state) {
		console.log("saving state");
		state = msg.save_state;
		chrome.storage.local.set({state: msg.save_state});
	}
	else if (msg.popup_subdomain_click) {
		console.log("subdomain check");
		state = msg.popup_subdomain_click;
		popup_subdomain_click();
	}
}

if (bIsChrome) {
	chrome.runtime.onMessage.addListener(notify);
	chrome.contextMenus.onClicked.addListener(handle_context_menu);
} else {
	browser.runtime.onMessage.addListener(notify);
	browser.contextMenus.onClicked.addListener(handle_context_menu);
}

// window.onload = get_state;

function onCreated() {
	if (bIsChrome) {
		if (chrome.runtime.lastError) {
			console.log(`Error: ${chrome.runtime.lastError}`);
		}
	} else {
		if (browser.runtime.lastError) {
			console.log(`Error: ${browser.runtime.lastError}`);
		}		
	}
}

function handle_context_menu(info, tab) {
  switch (info.menuItemId) {
    case "add":
			add_url();
			do_content_change();
      break;
    case "remove":
			remove_url();
			reload_tab();
      break;
  }
}
