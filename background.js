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

function clear_storage() {
	if (bIsChrome) {
		chrome.storage.local.clear();
	} else {
		browser.storage.local.clear();
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

function compare_urls(aa, bb) {
	let a = new URL(aa);
	let b = new URL(bb);
	if (a.hostname === b.hostname) {
		return true;
	}
	return false;
}

async function save_state() {
	if (bIsChrome) {
		chrome.storage.local.set({state: state});
	} else {
		browser.storage.local.set({state: state});
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
			state.subdomain_active = false;
			state.always_on = false;
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

function send_popup_state() {
	if (bIsChrome) {
		chrome.runtime.sendMessage({popup_state: state});
	} else {
		browser.runtime.sendMessage({popup_state: state});
	}
}

function popup_request_state() {
	get_state(get_active_tab, send_popup_state);
}

function content_request_state() {
	function send() {
		chrome.tabs.sendMessage(state.active_tab.id, {content_state: state});
	}

	get_state(get_active_tab, send);
	get_state(get_active_tab, setup_context_menu);
}

// callbackTwo
function setup_context_menu() {
	let change = {
		id: "change",
		title: state.cc_toggle ? "Change Colors 🗸" : "Change Colors",
		contexts: ["all"],
	};
	let sub = {
		id: "sub",
		title: state.subdomain_active ? "Change Subdomain 🗸" : "Change Subdomain",
		contexts: ["all"],
	};
	let always = {
		id: "always",
		title: state.always_on ? "Always On 🗸" : "Always On",
		contexts: ["all"],
	};
	let clear = {
		id: "clear",
		title: "Clear Data",
		contexts: ["all"],
	};

	if (bIsChrome) {
		chrome.contextMenus.remove("change", on_context_menu_item);
		chrome.contextMenus.remove("sub", on_context_menu_item);
		chrome.contextMenus.remove("always", on_context_menu_item);
		chrome.contextMenus.remove("clear", on_context_menu_item);

		chrome.contextMenus.create(change, on_context_menu_item);
		chrome.contextMenus.create(sub, on_context_menu_item);
		chrome.contextMenus.create(always, on_context_menu_item);
		chrome.contextMenus.create(clear, on_context_menu_item);
	} else {
		browser.contextMenus.remove("change", on_context_menu_item);
		browser.contextMenus.remove("sub", on_context_menu_item);
		browser.contextMenus.remove("always", on_context_menu_item);
		browser.contextMenus.remove("clear", on_context_menu_item);

		browser.contextMenus.create(change, on_context_menu_item);
		browser.contextMenus.create(sub, on_context_menu_item);
		browser.contextMenus.create(always, on_context_menu_item);
		browser.contextMenus.create(clear, on_context_menu_item);
	}
}

function on_context_menu_item() {
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
		case "change": handle_cc_btn(); break;
		case "sub": handle_cc_subdomain_btn(); break;
		case "always": handle_always_on_btn(); break;
		case "clear": handle_clear_btn(); break;
  }
}

function handle_cc_btn() {
	state.cc_toggle = !state.cc_toggle;
	if (state.subdomain_active || state.always_on) {
		state.cc_toggle = true;
	}
	save_state();

	if (state.cc_toggle) {
		do_content_change();
	} else {
		reload_tab();
	}
	send_popup_state();
	setup_context_menu();
}

function handle_cc_subdomain_btn() {
	state.subdomain_active = !state.subdomain_active;

	if (state.subdomain_active) {
		state.cc_toggle = true;
	} else {
		state.always_on ? state.cc_toggle = true : state.cc_toggle = false;
	}

	if (state.subdomain_active) {
		add_url();
		do_content_change();
	} else {
		remove_url();
		state.always_on ? true : reload_tab();
	}

	send_popup_state();
	setup_context_menu();
}

function handle_always_on_btn() {
	state.always_on = !state.always_on;
	if (state.always_on) {
		state.cc_toggle = true;
		save_state();
		do_content_change();
	} else {
		state.subdomain_active ? state.cc_toggle = true : state.cc_toggle = false;
		save_state();
		state.subdomain_active ? true : reload_tab();
	}
	send_popup_state();
	setup_context_menu();
}

function handle_clear_btn() {
	state.cc_toggle = false;
	state.subdomain_active = false;
	state.always_on = false;
	send_popup_state();

	clear_storage();
	reload_tab();

	setup_context_menu();
}

function notify(msg){
	if (msg.popup_request_state) {
		console.log("popup requested state", Date());
		popup_request_state();
	}
	else if (msg.content_request_state) {
		console.log("cc requested state", Date());
		content_request_state();
	}
	else if (msg.save_state) {
		state = msg.save_state;
		chrome.storage.local.set({state: msg.save_state});
	}

	// buttons
	else if (msg.handle_cc_btn) {
		state = msg.handle_cc_btn;
		handle_cc_btn();
	}
	else if (msg.handle_cc_subdomain_btn) {
		state = msg.handle_cc_subdomain_btn;
		handle_cc_subdomain_btn(null);
	}
	else if (msg.handle_always_on_btn) {
		state = msg.handle_always_on_btn;
		handle_always_on_btn();
	}
	else if (msg.handle_clear_btn) {
		state = msg.handle_clear_btn;
		handle_clear_btn();
	}
}

function tab_activated() {
	if (state) {
		if (state.active_tab) {
			chrome.tabs.sendMessage(state.active_tab.id, {content_state: state});
		}
	}
}

if (bIsChrome) {
	chrome.runtime.onMessage.addListener(notify);
	chrome.contextMenus.onClicked.addListener(handle_context_menu);
	chrome.tabs.onActivated.addListener(tab_activated);
} else {
	browser.runtime.onMessage.addListener(notify);
	browser.contextMenus.onClicked.addListener(handle_context_menu);
	browser.tabs.onActivated.addListener(tab_activated);
}