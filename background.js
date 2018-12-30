var bIsChrome = /Chrome/.test(navigator.userAgent);
var state = {};

function ChosenColor (hue, saturation, lightness, chosen_id) {
	this.hue = hue;
	this.saturation = saturation;
	this.lightness = lightness;
	this.chosen_id = chosen_id;

	this.hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	this.hsl_darker = `hsl(${hue}, ${saturation}%, ${lightness - 30}%)`;
	this.hsl_lighter = `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`;
	this.hsl_shift = `hsl(${hue + 60 % 360}, ${saturation + 20}%, ${lightness + 10}%)`;
	this.a_50 = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`;
}

function update_css() {
	console.log(state.li.hsl);
	console.log(state.li.hsl_shift);
	state.css = `
	.color-changer-sledge * {
		color: ${state.fg.hsl} !important;
		background-color: ${state.bg.hsl} !important;
		border-color: ${state.bg.hsl_lighter} !important;
	}
	.color-changer-sledge button {
		color: ${state.li.hsl} !important;
	}

	.color-changer-sledge input,
	.color-changer-sledge textarea,
	.color-changer-sledge pre,
	.color-changer-sledge code,
	.color-changer-sledge code span {
		background-color: ${state.bg.hsl_lighter} !important;
	}
	.color-changer-sledge a, .color-changer-sledge a * {
		color: ${state.li.hsl} !important;
		background-color: ${state.bg.hsl} !important;
	}
	.color-changer-sledge a:hover, .color-changer-sledge a:hover * {
		color: ${state.li.hsl_shift} !important;
	}
	.color-changer-sledge a:active, .color-changer-sledge a:active * {
		color: ${state.li.hsl_darker} !important;
	}
	.color-changer-sledge a:visited, .color-changer-sledge a:visited * {
		color: ${state.li.hsl_darker} !important;
	}
`;
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

function update_popup() {
	console.log("send popup state");
	if (bIsChrome) {
		chrome.runtime.sendMessage({popup_state: state});
	} else {
		browser.runtime.sendMessage({popup_state: state});
	}
}

function update_content() {
	update_css();
	var details = {};
	details.code = state.css;

	if (state.active_tab) {
		if (bIsChrome) {
			chrome.tabs.sendMessage(state.active_tab.id, {new_state: state});
		} else {
			browser.tabs.sendMessage(state.active_tab.id, {new_state: state});
		}
	}
}

function get_active_tab() {
	function check_tabs(tabs) {
		if (tabs[0]) { // Sanity check
			state.active_tab = tabs[0];
		} else {
			state.active_tab = null;
		}

		if (contains_url() > -1) {
			state.subdomain_active = true;
		} else {
			state.subdomain_active = false;
		}

		console.log("got active tab");
		create_context_menu();
		update_popup();
		update_content();
	}

	if (bIsChrome) {
		chrome.tabs.query({active: true, currentWindow: true}, check_tabs);
	} else {
		browser.tabs.query({active: true, currentWindow: true}, check_tabs);
	}
}

function init_state() {
	if (!state.fg) state.fg = new ChosenColor(0,  0, 80,  "zero");
	if (!state.bg) state.bg = new ChosenColor(0,  0, 25,  "zero");
	if (!state.li) state.li = new ChosenColor(68, 80, 80, "2-6");
	if (!state.urls) state.urls = [];
	if (!state.active_btn) state.active_btn = "fore";
	switch (state.active_btn) {
		case "fore": state.lightness = state.fg.lightness; break;
		case "back": state.lightness = state.bg.lightness; break;
		case "link": state.lightness = state.li.lightness; break;
	}
	if (!state.cc_toggle) state.cc_toggle = false;
	if (!state.subdomain_active) state.subdomain_active = false;
	if (!state.always_on) state.always_on = false;
	if (!state.css) state.css = "";
	// state.subdomain_active handled in get_active_tab
	// state.active_tab handled in get_active_tab
}

function get_state() {	
	function check_result(res) {
		if (res.state) {
			state = res.state;
		}
		init_state();

		console.log("got state");
		get_active_tab();
	}

	if (bIsChrome) {
		chrome.storage.local.get("state", check_result);
	} else {
		browser.storage.local.get("state", check_result);
	}
}

function create_context_menu() {
	let change = {
		id: "change",
		title: "Change Colors",
		contexts: ["all"],
		type: "checkbox",
		checked: state.cc_toggle,
		onclick: handle_cc_btn
	};
	let sub = {
		id: "sub",
		title: "Change Subdomain",
		contexts: ["all"],
		type: "checkbox",
		checked: state.subdomain_active,
		onclick: handle_cc_subdomain_btn
	};
	let always = {
		id: "always",
		title: "Always On",
		contexts: ["all"],
		type: "checkbox",
		checked: state.always_on,
		onclick: handle_always_on_btn
	};
	let clear = {
		id: "clear",
		title: "Clear Data",
		contexts: ["all"],
		onclick: handle_clear_btn
	};

	if (bIsChrome) {
		chrome.contextMenus.removeAll();
		chrome.contextMenus.create(change);
		chrome.contextMenus.create(sub);
		chrome.contextMenus.create(always);
		chrome.contextMenus.create(clear);
	} else {
		browser.contextMenus.removeAll();
		browser.contextMenus.create(change);
		browser.contextMenus.create(sub);
		browser.contextMenus.create(always);
		browser.contextMenus.create(clear);
	}
}

function update_context_menu_item(item, checked) {
	if (bIsChrome) {
		chrome.contextMenus.update(item, {checked: checked})
	} else {
		browser.contextMenus.update(item, {checked: checked})
	}
}

function handle_cc_btn() {
	state.cc_toggle = !state.cc_toggle;
	if (state.subdomain_active || state.always_on) {
		state.cc_toggle = true;
	}

	save_state();
	update_content();
	update_popup();
	update_context_menu_item("change", state.cc_toggle);
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
	} else {
		remove_url();
	}
	
	// add url and remove url handle saving state
	update_content();
	update_popup();
	update_context_menu_item("sub", state.subdomain_active);
}

function handle_always_on_btn() {
	state.always_on = !state.always_on;

	if (state.always_on) {
		state.cc_toggle = true;
	} else {
		state.subdomain_active ? state.cc_toggle = true : state.cc_toggle = false;
	}
	
	save_state();
	update_content();
	update_popup();
	update_context_menu_item("always", state.always_on);
}

function handle_clear_btn() {
	state.cc_toggle = false;
	state.subdomain_active = false;
	state.always_on = false;

	update_content();
	update_popup();
	clear_storage();

	update_context_menu_item("change", false);
	update_context_menu_item("sub", false);
	update_context_menu_item("always", false);
}

function handle_swatch_btn() {
	state.cc_toggle = true;

	save_state();
	update_content();
	update_popup();
	update_context_menu_item("change", state.cc_toggle);
}

function notify(msg){
	if (msg.popup_request_state) {
		console.log("popup requested state", Date());
		get_state();
	}
	else if (msg.content_request_state) {
		console.log("content requested state", Date());
		get_state();
	}
	if (msg.popup_new_state) {
		state = msg.popup_new_state;
		save_state();
		update_content();
	}
	else if (msg.save_state) {
		state = msg.save_state;
		save_state();
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
	else if (msg.handle_swatch_btn) {
		state = msg.handle_swatch_btn;
		handle_swatch_btn();
	}
}

async function tab_activated() {
	console.log("tab activated");
	get_state();
}

if (bIsChrome) {
	chrome.runtime.onMessage.addListener(notify);
	chrome.tabs.onActivated.addListener(tab_activated);
} else {
	browser.runtime.onMessage.addListener(notify);
	browser.tabs.onActivated.addListener(tab_activated);
}