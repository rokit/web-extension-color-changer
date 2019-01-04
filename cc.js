var bIsChrome = /Chrome/.test(navigator.userAgent);
var state = null;
var class_name = "color-changer-2";

var cc_style = document.createElement('style');
cc_style.id = "color-changer-style";

var observer = new MutationObserver(class_list_changed);
var observer_config = {attributes: true, attributeFilter: ["class"]};

function class_list_changed(mutationList, obs) {
	add_class();
}

function add_class() {
	let html = document.getElementsByTagName("HTML")[0];
	if (!html) return;
	if (!state) return;

	if (!html.classList.contains(class_name)) {
		html.classList.add(class_name);
	}

	observer.observe(html, observer_config);
}

function remove_class() {
	let html = document.getElementsByTagName("HTML")[0];
	if (!html) return;
	if (!state) return;

	html.classList.remove(class_name);
	observer.disconnect();
}

function notify(msg){
	if (msg.new_state) {
		state = msg.new_state;
		cc_style.textContent = state.css;

		if (!document.getElementById("color-changer-style")) {
			document.head.appendChild(cc_style);
		}

		if (state.url_index > -1 && state.urls[state.url_index].always || state.cc_toggle) {
			add_class();
		} else {
			remove_class();
		}
		if (state.url_index > -1 && !state.urls[state.url_index].always) {
			remove_class();
		}
	}
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

get_state();

document.onscroll = add_class();