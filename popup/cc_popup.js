var bIsChrome = /Chrome/.test(navigator.userAgent);

function Swatch (x, y, id, radius, hue, saturation, lightness) {
	this.x = x;
	this.y = y;
	this.id = id;
	this.hovered = false;
	this.radius = radius;
	this.hue = hue;
	this.saturation = saturation;
	this.lightness = lightness;
	this.hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function update_swatch (swatch, hue, saturation, lightness) {
	swatch.hue = hue;
	swatch.saturation = saturation;
	swatch.lightness = lightness;
	swatch.hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

var state = {};

var lightness_slider = document.getElementById("lightness");
var lightness_value = document.getElementById("lightness-value");

lightness_slider.oninput = function() {
	lightness_value.childNodes[0].nodeValue = `${this.value}%`;
	state.lightness = parseInt(this.value);
	
	draw_canvas();
}

var info = document.getElementById("info");
var info_text = document.querySelector("#info p");

var cc_btn = document.getElementById("cc");
var cc_always_btn = document.getElementById("cc-always");
var cc_never_btn = document.getElementById("cc-never");
var clear_btn = document.getElementById("clear-storage");

var fore = document.getElementById("fore");
var back = document.getElementById("back");
var link = document.getElementById("link");

var fore_swatch = document.getElementById("fore_swatch");
var back_swatch = document.getElementById("back_swatch");
var link_swatch = document.getElementById("link_swatch");

cc_btn.onclick = function() {
	if (bIsChrome) {
		chrome.runtime.sendMessage({handle_cc_btn: state});
	} else {
		browser.runtime.sendMessage({handle_cc_btn: state});
	}
};

cc_always_btn.onclick = function() {
	if (bIsChrome) {
		chrome.runtime.sendMessage({handle_cc_always_btn: state});
	} else {
		browser.runtime.sendMessage({handle_cc_always_btn: state});
	}
};

cc_always_btn.onmouseover = function() {
	let url = new URL(state.active_tab.url);
	info_text.textContent = `Always change pages on subdomain: ${url.hostname}`;
	info.style.opacity = 1;
}

cc_always_btn.onmouseout = function() {
	info.style.opacity = 0;
}

cc_never_btn.onclick = function() {
	if (bIsChrome) {
		chrome.runtime.sendMessage({handle_cc_never_btn: state});
	} else {
		browser.runtime.sendMessage({handle_cc_never_btn: state});
	}
};

cc_never_btn.onmouseover = function() {
	let url = new URL(state.active_tab.url);
	info_text.textContent = `Never change pages on subdomain: ${url.hostname}`;
	info.style.opacity = 1;
}

cc_never_btn.onmouseout = function() {
	info.style.opacity = 0;
}

clear_btn.onclick = function() {
	if (bIsChrome) {
		chrome.runtime.sendMessage({handle_clear_btn: state});
	} else {
		browser.runtime.sendMessage({handle_clear_btn: state});
	}
}

function handle_fore() {
	state.active_btn = "fore";
	state.lightness = state.fg.lightness;
	update_color_buttons();
}
function handle_back() {
	state.active_btn = "back";
	state.lightness = state.bg.lightness;
	update_color_buttons();
}
function handle_link() {
	state.active_btn = "link";
	state.lightness = state.li.lightness;
	update_color_buttons();
}
fore_swatch.onclick = handle_fore;
fore.onclick = handle_fore;
back_swatch.onclick = handle_back;
back.onclick = handle_back;
link_swatch.onclick = handle_link;
link.onclick = handle_link;

function update_color_buttons() {
	lightness_slider.value = state.lightness;
	lightness_value.childNodes[0].nodeValue = `${state.lightness}%`;
	draw_canvas();
	set_active_color_button();
	save_state(); // does not update content
}

function set_button_active(btn, bActive) {
	var check = " 🗸";
	if (bActive) {
		btn.classList.add("active-btn");
		btn.textContent = btn.dataset.value + check;
	} else {
		btn.classList.remove("active-btn");
		btn.textContent = btn.dataset.value;
	}
}

function set_active_color_button() {
	fore.classList.remove("active-btn");
	back.classList.remove("active-btn");
	link.classList.remove("active-btn");

	document.getElementById(state.active_btn).classList.add("active-btn");
	set_active_swatch_button();
}

function set_active_swatch_button() {
	fore_swatch.classList.remove("active-swatch");
	back_swatch.classList.remove("active-swatch");
	link_swatch.classList.remove("active-swatch");

	document.getElementById(`${state.active_btn}_swatch`).classList.add("active-swatch");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//-------------------------------------------------------------------------------------------------Canvas
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
canvas.width = document.querySelector("canvas").offsetWidth;
canvas.height = document.querySelector("canvas").offsetHeight;
var canvas_height = document.querySelector("canvas").offsetHeight;

var origin_x = canvas.width / 2;
var origin_y = canvas.height / 2;

var big_radius = canvas_height / 6;
var little_radius = canvas_height / 30;
var ellipse_length = 1.5;
var big_line = 3;
var little_line = 1;

var gap = canvas_height / 14;
var little_gap = canvas_height / 30;
var num_swatches = 16;
var steps = num_swatches / 2;
var rings = 3;
var saturation_steps = 100 / rings;
var stroke_color = "#555555";

let stroke_hover_width = 5;

let zero_sat_offset_x = origin_x - canvas.width * 0.40;
let zero_sat_offset_y = origin_y + canvas.width * 0.3;

let zero_sat_text_offset_y = zero_sat_offset_y - 30;
let sat_radius = big_radius * 0.5;

var hover_id = null;

var swatches = {};

function to_rad(degrees) {
  return degrees * (Math.PI/180);
}

function draw_canvas() {
	ctx.fillStyle = "white";
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	ctx.font = '16pt Helvetica';
	ctx.fillText("Gray", zero_sat_offset_x, zero_sat_text_offset_y); 

	ctx.beginPath();
	ctx.arc(zero_sat_offset_x, zero_sat_offset_y, sat_radius, 0, 2 * Math.PI, true);
	ctx.fillStyle = `hsl(0, 0%, ${state.lightness}%)`;
	ctx.fill();
	ctx.strokeStyle = stroke_color;
	hover_id === "zero" ? ctx.lineWidth = stroke_hover_width : ctx.lineWidth = 1;

	if (
		(state.active_btn === "fore" && state.fg.chosen_id === "zero") ||
		(state.active_btn === "back" && state.bg.chosen_id === "zero") ||
		(state.active_btn === "link" && state.li.chosen_id === "zero")) {
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = stroke_hover_width;
			ctx.setLineDash([5, 2]);
	}
	ctx.stroke();
	ctx.setLineDash([0]);

	if (swatches["zero"]) {
		update_swatch(swatches["zero"], 0, 0, state.lightness);
	} else {
		swatches["zero"] = new Swatch(zero_sat_offset_x, zero_sat_offset_y, "zero", sat_radius, 0, 0, state.lightness);
	}

	for (var j = 0; j < rings; j++) {
		let adjusted_num_swatches = num_swatches + (j * steps);
		for (var i = 0; i < adjusted_num_swatches; i++) {
			let angle = 360 / adjusted_num_swatches;
			let x = origin_x + ((big_radius + gap + (j * little_gap) + (j * little_radius * 2)) * Math.cos(to_rad(angle * i)));
			let y = origin_y + ((big_radius + gap + (j * little_gap) + (j * little_radius * 2)) * Math.sin(to_rad(angle * i)));
			
			let hue = angle * i;
			let saturation = (j * saturation_steps + (100 - (saturation_steps * (rings - 1))));
			
			let = id = `${j}-${i}`;
			
			ctx.beginPath();
			ctx.ellipse(x, y, little_radius, little_radius * ellipse_length, to_rad(hue - 45), 0, 2 * Math.PI, false);
			ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${state.lightness}%)`;
			ctx.fill();
			
			if (swatches[id]) {
				update_swatch(swatches[id], hue, saturation, state.lightness);
			} else {
				swatches[id] = new Swatch(x, y, id, little_radius, hue, saturation, state.lightness);
			}

			ctx.strokeStyle = stroke_color;
			hover_id === id ? ctx.lineWidth = stroke_hover_width : ctx.lineWidth = 1;

			if (	(state.active_btn === "fore" && state.fg.chosen_id === id) ||
				  	(state.active_btn === "back" && state.bg.chosen_id === id) ||
				  	(state.active_btn === "link" && state.li.chosen_id === id)	) {
					ctx.strokeStyle = "#000000";
					ctx.lineWidth = stroke_hover_width;
					ctx.setLineDash([5, 2]);
			}
			ctx.stroke();
			ctx.setLineDash([0]);
		}
	}
	if (hover_id) {
		ctx.beginPath();
		ctx.arc(origin_x, origin_y, big_radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = swatches[hover_id].hsl;
		ctx.fill();
		ctx.closePath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = stroke_color;
		ctx.stroke();

		// shows swatch id in center
		// ctx.fillStyle = "black";
		// ctx.textAlign = "center";
		// ctx.font = '16pt Helvetica';
		// ctx.fillText(`${hover_id}`, origin_x, origin_y); 
	}
}

function check_collision(swatches, x, y) {
	for (var s in swatches) {
		var left = swatches[s].x - swatches[s].radius;
		var right = swatches[s].x + swatches[s].radius;
		var top = swatches[s].y - swatches[s].radius;
		var bottom = swatches[s].y + swatches[s].radius;

		if (right >= x
				&& left <= x
				&& bottom >= y
				&& top <= y) {
				return swatches[s];
		}		
	}
	return false;
}
  
canvas.onclick = function(e) {
	var swatch = check_collision(swatches, e.offsetX, e.offsetY);
	if (swatch) {
		if (bIsChrome) {
			chrome.runtime.sendMessage({handle_swatch_btn: state, swatch: swatch});
		} else {
			browser.runtime.sendMessage({handle_swatch_btn: state, swatch: swatch});
		}
	}
};

canvas.onmouseout = function() {
	hover_id = null;
	draw_canvas();
}

canvas.onmousemove = function(e) {

	var swatch = check_collision(swatches, e.offsetX, e.offsetY);

	if (swatch) {
			hover_id = swatch.id;

			draw_canvas();
			
			canvas.style.cursor = 'pointer';
	} else {
			canvas.style.cursor = 'default';
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

async function update_ui() {
	fore_swatch.style.background = state.fg.hsl;
	back_swatch.style.background = state.bg.hsl;
	link_swatch.style.background = state.li.hsl;

	if (state.url_index > -1) {
		let bAlways = state.urls[state.url_index].always;
		set_button_active(cc_always_btn, bAlways);
		set_button_active(cc_never_btn, !bAlways);
	} else {
		set_button_active(cc_always_btn, false);
		set_button_active(cc_never_btn, false);
	}
	set_button_active(cc_btn, state.cc_toggle);

	update_color_buttons();
}

async function save_state() {
	if (bIsChrome) {
		chrome.runtime.sendMessage({save_state: state});
	} else {
		browser.runtime.sendMessage({save_state: state});
	}
}

async function get_state() {
	if (bIsChrome) {
		chrome.runtime.sendMessage({popup_request_state: true});
	} else {
		browser.runtime.sendMessage({popup_request_state: true});
	}
}

function notify(msg){
	if (msg.popup_state) {
		state = msg.popup_state;
		update_ui();
	}
}

window.onload = get_state;

if (bIsChrome) {
	chrome.runtime.onMessage.addListener(notify);
} else {
	browser.runtime.onMessage.addListener(notify);
}