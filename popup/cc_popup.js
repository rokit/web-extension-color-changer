function Swatch (x, y, id, radius, hue, saturation, lightness) {
	var lighter = lightness + 15;
	var darker = lightness - 15;
	this.x = x;
	this.y = y;
	this.id = id;
	this.hovered = false;
	this.radius = radius;
	this.hue = hue;
	this.saturation = saturation;
	this.lightness = lightness;
	this.hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	this.darker = `hsl(${hue}, ${saturation}%, ${darker}%)`;
	this.lighter = `hsl(${hue}, ${saturation}%, ${lighter}%)`;
	this.a_50 = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`;
}

function CC_URL(url, type)  {
	this.url = url;
	this.type = type;
}

var hover_id = null;

var settings = {};
var cc_type = null;

var lightness_slider = document.getElementById("lightness");
var lightness_output = document.getElementById("lightness-value");

lightness_slider.oninput = function() {
	lightness_output.innerHTML = `${this.value}%`;
	settings.lightness = parseInt(this.value);
	
	// save_settings();
	draw_canvas();
}

// var active_btn = null;
var active_btn_color = "#9B9EE3";
var inactive_btn_color = "#eeeeee";

var active_tab = null;
var cc_page_btn = document.getElementById("cc-page");
var cc_subdomain_btn = document.getElementById("cc-subdomain");
var cc_domain_btn = document.getElementById("cc-domain");

var fore = document.getElementById("fore");
var back = document.getElementById("back");
var link = document.getElementById("link");

var fore_swatch = document.getElementById("fore_swatch");
var back_swatch = document.getElementById("back_swatch");
var link_swatch = document.getElementById("link_swatch");

cc_page_btn.onclick = function() {
	console.log("-----------------------before cc_type ", cc_type);
	cc_type = "page";
	set_active_cc_button();
	check_urls();
	save_and_commit();
};
cc_subdomain_btn.onclick = function() {
	cc_type = "subdomain";
	set_active_cc_button();
	check_urls();
	save_and_commit();
};
cc_domain_btn.onclick = function() {
	cc_type = "domain";
	set_active_cc_button();
	check_urls();
	save_and_commit();
};

fore_swatch.onclick = function() {
	settings.active_btn = "fore";
	set_active_color_button();
	set_active_swatch();
	save_settings();
};
back_swatch.onclick = function() {
	settings.active_btn = "back";
	set_active_color_button();
	set_active_swatch();
	save_settings();
};
link_swatch.onclick = function() {
	settings.active_btn = "link";
	set_active_color_button();
	set_active_swatch();
	save_settings();
};

fore.onclick = function() {
	settings.active_btn = "fore";
	lightness_slider.value = settings.fg.lightness;
	settings.lightness = settings.fg.lightness;
	lightness_output.innerHTML = `${settings.lightness}%`;
	draw_canvas();
	set_active_color_button();
	set_active_swatch();
	save_settings();
}
back.onclick = function() {
	settings.active_btn = "back";
	lightness_slider.value = settings.bg.lightness;
	settings.lightness = settings.bg.lightness;
	lightness_output.innerHTML = `${settings.lightness}%`;
	draw_canvas();
	set_active_color_button();
	set_active_swatch();
	save_settings();
}
link.onclick = function() {
	settings.active_btn = "link";
	lightness_slider.value = settings.li.lightness;
	settings.lightness = settings.li.lightness;
	lightness_output.innerHTML = `${settings.lightness}%`;
	draw_canvas();
	set_active_color_button();
	set_active_swatch();
	save_settings();
}

function set_active_color_button() {
	fore.classList.remove("active-btn");
	back.classList.remove("active-btn");
	link.classList.remove("active-btn");

	document.getElementById(settings.active_btn).classList.add("active-btn");
}

function set_active_cc_button() {
	cc_page_btn.classList.remove("active-btn");
	cc_subdomain_btn.classList.remove("active-btn");
	cc_domain_btn.classList.remove("active-btn");

	if (cc_type) {
		document.getElementById(`cc-${cc_type}`).classList.add("active-btn");
	}
}

function set_active_swatch() {
	fore_swatch.classList.remove("active-swatch");
	back_swatch.classList.remove("active-swatch");
	link_swatch.classList.remove("active-swatch");

	document.getElementById(`${settings.active_btn}_swatch`).classList.add("active-swatch");
}

var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var base_width = document.querySelector("canvas").offsetHeight;
canvas.width = document.querySelector("canvas").offsetWidth;
canvas.height = base_width;

var origin_x = canvas.width / 2;
var origin_y = canvas.height / 2;

var big_radius = base_width / 6;
var little_radius = base_width / 30;
var big_line = 3;
var little_line = 1;

var gap = base_width / 14;
var little_gap = base_width / 30;
var num_swatches = 16;
var steps = num_swatches / 2;
var rings = 3;
var saturation_steps = 100 / rings;
var stroke_color = "#555555";

let stroke_hover_width = 5;

let zero_sat_offset_x = origin_x - canvas.width * 0.40;
let zero_sat_offset_y = origin_y + canvas.width * 0.3;

let zero_sat_text_offset_y = zero_sat_offset_y - 25;
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
	ctx.fillStyle = `hsl(0, 0%, ${settings.lightness}%)`;
	ctx.fill();
	ctx.strokeStyle = stroke_color;
	hover_id === "zero" ? ctx.lineWidth = stroke_hover_width : ctx.lineWidth = 1;

	if (settings.active_btn === "fore") {
		if (settings.fg.id === "zero") {
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = stroke_hover_width;
		}
	}
	else if (settings.active_btn === "back") {
		if (settings.bg.id === "zero") {
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = stroke_hover_width;						
		}
	}
	else if (settings.active_btn === "link") {
		if (settings.li.id === "zero") {
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = stroke_hover_width;							
		}
	}
	ctx.stroke();
	swatches["zero"] = new Swatch(zero_sat_offset_x, zero_sat_offset_y, "zero", sat_radius, 0, 0, settings.lightness);


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
			ctx.ellipse(x, y, little_radius, little_radius * 1.5, to_rad(hue - 45), 0, 2 * Math.PI, false);
			// ctx.arc(x, y, little_radius, 0, 2 * Math.PI, false);
			ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${settings.lightness}%)`;
			ctx.fill();
			
			// this pattern has 73 elements including the zero sat
			swatches[id] = new Swatch(x, y, id, little_radius, hue, saturation, settings.lightness);
			// if (swatches.length < 73) {
			// 	swatches.push(new Swatch(x, y, id, little_radius, hue, saturation, settings.lightness));
			// }
			// console.log("is it true ", settings.fg.id === id);
			// 
			// 
			ctx.strokeStyle = stroke_color;
			hover_id === id ? ctx.lineWidth = stroke_hover_width : ctx.lineWidth = 1;

			if (settings.active_btn === "fore") {
				if (settings.fg.id === id) {
					ctx.strokeStyle = "#000000";
					ctx.lineWidth = stroke_hover_width;
				}
			}
			else if (settings.active_btn === "back") {
				if (settings.bg.id === id) {
					ctx.strokeStyle = "#000000";
					ctx.lineWidth = stroke_hover_width;						
				}
			}
			else if (settings.active_btn === "link") {
				if (settings.li.id === id) {
					ctx.strokeStyle = "#000000";
					ctx.lineWidth = stroke_hover_width;							
				}
			}

			ctx.stroke();
		}
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
		switch(settings.active_btn) {
			case "fore": settings.fg = swatch; fore_swatch.style.background = settings.fg.hsl; break;
			case "back": settings.bg = swatch; back_swatch.style.background = settings.bg.hsl; break;
			case "link": settings.li = swatch; link_swatch.style.background = settings.li.hsl; break;
			default: break;
		}
		save_and_commit();
	}
};

canvas.onmouseout = function() {
	hover_id = "nothing";
}
canvas.onmousemove = function(e) {

	var swatch = check_collision(swatches, e.offsetX, e.offsetY);

	if (swatch) {
			hover_id = swatch.id;

			draw_canvas();
			
			ctx.beginPath();
			ctx.arc(origin_x, origin_y, big_radius, 0, 2 * Math.PI, false);
			ctx.fillStyle = swatch.hsl;
			ctx.fill();
			ctx.closePath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = stroke_color;
			ctx.stroke();
			canvas.style.cursor = 'pointer';
	} else {
			canvas.style.cursor = 'default';
	}
};

async function save_and_commit() {
	// await get_active_tab();
	await save_settings();
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
	// browser.tabs.insertCSS(active_tab.id, {
	// file: "/cc.css",})
	// .catch(console.error.bind(console));

	browser.tabs.sendMessage(active_tab.id, {
		settings: settings
	});
}

async function check_urls() {
	if (!active_tab) return;
	if (!active_tab.url) return;

	// always add individual pages
	if (cc_type === "page") {
		settings.urls.push(new CC_URL(active_tab.url, cc_type));
	}

	let bFoundMatch = false;
	for (let i = 0; i < settings.urls.length; i++) {
		let url = settings.urls[i].url;
		// see if tab url domain is already in our list
		if (compare_urls(url, active_tab.url, "domain")) {
			// if we're already tracking this domain, then just change its type
			settings.urls[i].type = cc_type;
			bFoundMatch = true;
		}
	}

	// if no match was found, this is a new url
	if (!bFoundMatch) {
		settings.urls.push(new CC_URL(active_tab.url, cc_type));
	}
}

async function save_settings() {
	browser.storage.local.set({
		settings: settings
	});
}
async function init(storage) {
	// console.log("popup settings: ", storage.settings);
	if (storage.settings) {
		settings = storage.settings;
	} else {
		settings.fg = new Swatch(0, 0, "1-2", 0, 0, 0, 80);
		settings.bg = new Swatch(0, 0, "0-3", 0, 0, 0, 25);
		settings.li = new Swatch(0, 0, "2-11", 0, 68, 80, 80);
		settings.active_btn = "fore";
		settings.urls = [];
		settings.lightness = 70;
		settings.domain_re = /[a-zA-Z0-9]{1,61}\.[a-zA-Z]{2,}$/;
	}
	console.log("from init", settings.fg.id);
	
	fore_swatch.style.background = settings.fg.hsl;
	back_swatch.style.background = settings.bg.hsl;
	link_swatch.style.background = settings.li.hsl;
	
	lightness_slider.value = settings.lightness;
	lightness_output.innerHTML = `${settings.lightness}%`;

	await get_active_tab();
	
	for (let i = 0; i < settings.urls.length; i++) {
		let url = settings.urls[i].url;
		let type = settings.urls[i].type;
		if (compare_urls(url, active_tab.url, type)) {
			cc_type = type;
		}
	}

	draw_canvas();

	set_active_color_button();
	set_active_swatch();
	set_active_cc_button();
	// console.log(settings);
}

function compare_urls(aa, bb, type) {
	let a = new URL(aa);
	let b = new URL(bb);

	switch(type) {
		case "page": if (a.href === b.href) return true; break;
		case "subdomain": if (a.hostname === b.hostname) return true; break;
		case "domain": {
			// console.log(a.hostname);
			// console.log(b.hostname);
			// console.log(settings.domain_re.exec(a.hostname));
			// console.log(settings.domain_re.exec(b.hostname));
			if (settings.domain_re.exec(a.hostname)[0] === settings.domain_re.exec(b.hostname)[0]) return true;
		} break;
		default: return false;
	}
}

function get_settings() {
	var getting = browser.storage.local.get("settings");
	getting.then(init, on_error);

  function on_error(error) {
    console.log(`Error: ${error}`);
  }
}

document.addEventListener("DOMContentLoaded", get_settings);