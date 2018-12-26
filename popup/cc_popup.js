
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

function update_chosen_color (col, hue, saturation, lightness, chosen_id) {
	col.hue = hue;
	col.saturation = saturation;
	col.lightness = lightness;
	col.chosen_id = chosen_id;

	col.hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	col.hsl_darker = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
	col.hsl_lighter = `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`;
	this.hsl_shift = `hsl(${hue + 40 % 360}, ${saturation}%, ${lightness}%)`;
	col.a_50 = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`;
}

var hover_id = null;

var state = {};

var lightness_slider = document.getElementById("lightness");
var lightness_output = document.getElementById("lightness-value");

lightness_slider.oninput = function() {
	lightness_output.innerHTML = `${this.value}%`;
	state.lightness = parseInt(this.value);
	
	draw_canvas();
}

var active_btn_color = "#9B9EE3";
var inactive_btn_color = "#eeeeee";

var active_tab = null;

var cc_subdomain_btn = document.getElementById("cc-subdomain");
var clear_btn = document.getElementById("clear-storage");

var fore = document.getElementById("fore");
var back = document.getElementById("back");
var link = document.getElementById("link");

var fore_swatch = document.getElementById("fore_swatch");
var back_swatch = document.getElementById("back_swatch");
var link_swatch = document.getElementById("link_swatch");

cc_subdomain_btn.onclick = async function() {
	if (contains_url() > -1) {
		await remove_url();
		set_button_active(false);
		browser.tabs.reload(
			active_tab.id
		)
	} else {
		await add_url();
		set_button_active(true);
		send_message();
	}
};

clear_btn.onclick = function() {
	browser.storage.local.clear();
	// init_state();
	browser.tabs.reload(
		active_tab.id
	)
}

fore_swatch.onclick = function() {
	state.active_btn = "fore";
	state.lightness = state.fg.lightness;
	update_color_buttons();
	save_state();
};
back_swatch.onclick = function() {
	state.active_btn = "back";
	state.lightness = state.bg.lightness;
	update_color_buttons();
	save_state();
};
link_swatch.onclick = function() {
	state.active_btn = "link";
	state.lightness = state.li.lightness;
	update_color_buttons();
	save_state();
};
fore.onclick = function() {
	state.active_btn = "fore";
	state.lightness = state.fg.lightness;
	update_color_buttons();
	save_state();
}
back.onclick = function() {
	state.active_btn = "back";
	state.lightness = state.bg.lightness;
	update_color_buttons();
	save_state();
}
link.onclick = function() {
	state.active_btn = "link";
	state.lightness = state.li.lightness;
	update_color_buttons();
	save_state();
}

function update_color_buttons() {
	lightness_slider.value = state.lightness;
	lightness_output.innerHTML = `${state.lightness}%`;
	draw_canvas();
	set_active_color_button();
	set_active_swatch();
}

function set_button_active(bActive) {
	if (bActive) {
		cc_subdomain_btn.classList.add("active-btn");
		cc_subdomain_btn.innerHTML = "Change Colors 🗸"
	} else {
		cc_subdomain_btn.classList.remove("active-btn");
		cc_subdomain_btn.innerHTML = "Change Colors"
	}
}

function set_active_color_button() {
	fore.classList.remove("active-btn");
	back.classList.remove("active-btn");
	link.classList.remove("active-btn");

	document.getElementById(state.active_btn).classList.add("active-btn");
}



function set_active_swatch() {
	fore_swatch.classList.remove("active-swatch");
	back_swatch.classList.remove("active-swatch");
	link_swatch.classList.remove("active-swatch");

	document.getElementById(`${state.active_btn}_swatch`).classList.add("active-swatch");
}

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

var swatches = {};

function to_rad(degrees) {
  return degrees * (Math.PI/180);
}

function draw_canvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	ctx.font = '16pt Helvetica';
	ctx.fillText("0% Sat", zero_sat_offset_x, zero_sat_text_offset_y); 

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
			// ctx.arc(x, y, little_radius, 0, 2 * Math.PI, false);
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

		// ctx.fillStyle = "black";
		// ctx.textAlign = "center";
		// ctx.font = '16pt Helvetica';
		// ctx.fillText(`${hover_id}`, origin_x, origin_y); 
	}
}

function check_collision(swatches, x, y) {
	for (var s in swatches) {
		// console.log(swatches[s]);
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
		switch(state.active_btn) {
			case "fore": update_chosen_color(state.fg, swatch.hue, swatch.saturation, swatch.lightness, swatch.id); fore_swatch.style.background = state.fg.hsl; break;
			case "back": update_chosen_color(state.bg, swatch.hue, swatch.saturation, swatch.lightness, swatch.id); back_swatch.style.background = state.bg.hsl; break;
			case "link": update_chosen_color(state.li, swatch.hue, swatch.saturation, swatch.lightness, swatch.id); link_swatch.style.background = state.li.hsl; break;
			default: break;
		}

		save_and_commit();
		draw_canvas();
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

async function save_and_commit() {
	await save_state();
	send_message();
}

async function get_active_tab() {
	var query = browser.tabs.query({currentWindow: true, active: true});
	await query.then(get_tab, onError);

	function onError(error) {
		console.log(`Error: ${error}`);
	}

	function get_tab(tabs) {
		for (let tab of tabs){
			active_tab = tab;
		}
	}
}

function send_message() {
	browser.tabs.sendMessage(active_tab.id, {
		state: state
	});
	// browser.tabs.reload(
	// 	active_tab.id
	// )
}

async function add_url() {
	if (!active_tab) return;
	if (!active_tab.url) return;

	for (let i = 0; i < state.urls.length; i++) {
		if (compare_url(state.urls[i], active_tab.url)) {
			// url already added
			return;
		}
	}

	// if no match was found, this is a new url
	state.urls.push(active_tab.url);
	save_state();
}

async function remove_url() {
	if (!active_tab) return;
	if (!active_tab.url) return;

	let i = contains_url();
	if (i > -1) {
		state.urls.splice(i, 1);
		save_state();
	}
}

// check if tab url is already in our list
function contains_url() {
	for (let i = 0; i < state.urls.length; i++) {
		if (compare_url(state.urls[i], active_tab.url)) {
			return i;
		}
	}
	return -1;
}

async function save_state() {
	browser.storage.local.set({
		state: state
	});
}

function init_state() {
	state.fg = new ChosenColor(0,  0, 80,  "zero");
	state.bg = new ChosenColor(0,  0, 25,  "zero");
	state.li = new ChosenColor(68, 80, 80, "2-6");
	state.active_btn = "fore";
	state.urls = [];
	state.lightness = state.fg.lightness;
}

async function init(storage) {
	if (storage.state) {
		state = storage.state;
	} else {
		init_state();
	}
	
	fore_swatch.style.background = state.fg.hsl;
	back_swatch.style.background = state.bg.hsl;
	link_swatch.style.background = state.li.hsl;
	
	await get_active_tab();
	
	if (contains_url() > -1) {
		set_button_active(true);
		// send_message();
	}

	update_color_buttons();
	// console.log(state);
}

function compare_url(aa, bb) {
	let a = new URL(aa);
	let b = new URL(bb);
	if (a.hostname === b.hostname) {
		return true;
	}
	return false;
}

function get_state() {
	var getting = browser.storage.local.get("state");
	getting.then(init, on_error);

  function on_error(error) {
    console.log(`Error: ${error}`);
  }
}

document.addEventListener("DOMContentLoaded", get_state);