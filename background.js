var bIsChrome = /Chrome/.test(navigator.userAgent);
// var class_name = "color-changer-2";
// var state = {};


// function CC_URL (url, bAlways) {
//   this.url = url;
//   this.type = "sub";
//   this.always = bAlways;
// }

// function update_css() {
//   state.css = `
//   .${class_name} {
//     background-color: ${state.bg.hsl} !important;
//   }
//   .${class_name} * {
//     color: ${state.fg.hsl} !important;
//     background-color: ${state.bg.hsl} !important;
//     border-color: ${state.bg.lightness_shift} !important;
//   }
//   .${class_name} *:before, .${class_name} *:after {
//     color: ${state.fg.hsl} !important;
//     background: ${state.bg.hsl} !important;
//     border-color: ${state.bg.lightness_shift} !important;
//   }
//   .${class_name} img {
//     visibility: visible !important;
//   }
//   .${class_name} button {
//     color: ${state.li.hsl} !important;
//   }

//   .${class_name} input, .${class_name} input *,
//   .${class_name} textarea, .${class_name} textarea *,
//   .${class_name} pre, .${class_name} pre *,
//   .${class_name} code, .${class_name} code * {
//     background-color: ${state.bg.lightness_shift} !important;
//   }

//   .${class_name} a, .${class_name} a * {
//     color: ${state.li.hsl} !important;
//     background-color: ${state.bg.hsl} !important;
//   }
//   .${class_name} a:hover, .${class_name} a:hover * {
//     color: ${state.li.hue_hovered} !important;
//   }
//   .${class_name} a:active, .${class_name} a:active * {
//     color: ${state.li.hue_visited} !important;
//   }
//   .${class_name} a:visited, .${class_name} a:visited * {
//     color: ${state.li.hue_visited} !important;
//   }
// `;
// }

// function clear_storage() {
//   if (bIsChrome) {
//     chrome.storage.local.clear();
//   } else {
//     browser.storage.local.clear();
//   }
// }

// async function add_url(bAlways) {
//   if (!state.active_tab) return;
//   if (!state.active_tab.url) return;

//   for (let i = 0; i < state.urls.length; i++) {
//     if (compare_urls(state.urls[i].url, state.active_tab.url)) {
//       // url already added, so just update it
//       state.urls[i].always = bAlways;
//       state.url_index = i;
//       await save_state()
//       return;
//     }
//   }

//   // if no match was found, this is a new url
//   state.url_index = state.urls.push(new CC_URL(state.active_tab.url, bAlways)) - 1;
//   await save_state();
// }

// async function remove_url() {
//   if (!state.active_tab) return;
//   if (!state.active_tab.url) return;

//   let i = contains_url();
//   if (i > -1) {
//     state.urls.splice(i, 1);
//     state.url_index = -1; // hmm
//     await save_state();
//   }
// }

// // check if tab url is already in our list
// function contains_url() {
//   if (state.urls) {
//     for (let i = 0; i < state.urls.length; i++) {
//       if (compare_urls(state.urls[i].url, state.active_tab.url)) {
//         return i;
//       }
//     }
//     return -1;
//   }
// }

// function compare_urls(aa, bb) {
//   let a = new URL(aa);
//   let b = new URL(bb);
//   if (a.hostname === b.hostname) {
//     return true;
//   }
//   return false;
// }

// async function save_state() {
//   console.log('save state called');
//   console.log('state.cc_toggle', state.cc_toggle);
//   if (bIsChrome) {
//     chrome.storage.local.set({state});
//   } else {
//     browser.storage.local.set({state});
//   }
// }

// function update_popup() {
//   console.log('updating popup');
//   if (bIsChrome) {
//     chrome.runtime.sendMessage({popup_state: state});
//   } else {
//     browser.runtime.sendMessage({popup_state: state});
//   }
// }

// function update_content() {
//   update_css();

//   if (state.active_tab) {
//     if (bIsChrome) {
//       chrome.tabs.sendMessage(state.active_tab.id, {new_state: state});
//     } else {
//       browser.tabs.sendMessage(state.active_tab.id, {new_state: state});
//     }
//   }
// }

// function getActiveTab(response) {
//   console.log('getting active tab');
//   function checkTabs(tabs) {
//     response(tabs[0])
//   }

//   if (bIsChrome) {
//     chrome.tabs.query({active: true, currentWindow: true}, checkTabs);
//   } else {
//     browser.tabs.query({active: true, currentWindow: true}, checkTabs);
//   }
// }

// async function init_state() {
//   console.log('init state called');
//   if (!state.fg) state.fg = new ChosenColor(0,  0, 80,  "zero");
//   if (!state.bg) state.bg = new ChosenColor(0,  0, 25,  "zero");
//   if (!state.li) state.li = new ChosenColor(68, 80, 80, "2-6");

//   if (!state.urls) {
//     state.urls = [];
//   }
//   else {
//     // urls present
//     // urls used to be an array of strings, but now it's objects,
//     // so we need to update urls entry.
//     if (state.urls.length > 0) {
//       if (!state.urls[0].url) {
//         // urls length is greater than zero, but url object is not present,
//         // so reset urls
//         state.urls = [];
//       }
//     }
//   }

//   if (!state.active_btn) state.active_btn = "fore";
//   switch (state.active_btn) {
//     case "fore": state.lightness = state.fg.lightness; break;
//     case "back": state.lightness = state.bg.lightness; break;
//     case "link": state.lightness = state.li.lightness; break;
//   }

//   // if undefined
//   if (!state.cc_toggle) state.cc_toggle = false;
//   if (!state.css) state.css = "";

//   update_css();
// }

// async function get_state() {
//   console.log('get state called');
//   async function check_result(res) {
//     if (res.state) {
//       state = res.state;
//     }
//     await init_state();
//     get_active_tab();
//   }

//   if (bIsChrome) {
//     chrome.storage.local.get("state", check_result);
//   } else {
//     browser.storage.local.get("state", check_result);
//   }
// }

// function create_context_menu() {
//   let change = {
//     id: "change_colors",
//     title: "Change Colors",
//     contexts: ["all"],
//     type: "checkbox",
//     checked: state.cc_toggle,
//     onclick: handle_cc_btn
//   };
//   let sub_always = {
//     id: "sub_always",
//     title: "Always",
//     contexts: ["all"],
//     type: "checkbox",
//     checked: state.url_index > -1 ? state.urls[state.url_index].always : false,
//     onclick: handle_cc_always_btn
//   };
//   let sub_never = {
//     id: "sub_never",
//     title: "Never",
//     contexts: ["all"],
//     type: "checkbox",
//     checked: state.url_index > -1 ? !state.urls[state.url_index].always : false,
//     onclick: handle_cc_never_btn
//   };
//   let clear = {
//     id: "clear",
//     title: "Clear Data",
//     contexts: ["all"],
//     onclick: handle_clear_btn
//   };

//   if (bIsChrome) {
//     chrome.contextMenus.removeAll();
//     chrome.contextMenus.create(change);
//     chrome.contextMenus.create(sub_always);
//     chrome.contextMenus.create(sub_never);
//     chrome.contextMenus.create(clear);
//   } else {
//     browser.contextMenus.removeAll();
//     browser.contextMenus.create(change);
//     browser.contextMenus.create(sub_always);
//     browser.contextMenus.create(sub_never);
//     browser.contextMenus.create(clear);
//   }
// }

// function update_context_menu_item(item, checked) {
//   if (bIsChrome) {
//     chrome.contextMenus.update(item, {checked})
//   } else {
//     browser.contextMenus.update(item, {checked})
//   }
// }

// function handle_cc_btn() {
//   // state.cc_toggle = !state.cc_toggle;

//   save_state();
//   update_content();
//   update_popup();
//   update_context_menu_item("change_colors", state.cc_toggle);
// }

// async function handle_cc_always_btn() {

//   // add_url() and remove_url() will save state
//   if (state.url_index > -1 && state.urls[state.url_index].always) {
//     // url in list and always = true, so remove this url
//     await remove_url();
//   } else {
//     await add_url(true);
//   }

//   update_content();
//   update_popup();

//   if (state.url_index === -1) {
//     update_context_menu_item("sub_always", false);
//     update_context_menu_item("sub_never", false);
//   } else {
//     update_context_menu_item("sub_always", state.urls[state.url_index].always);
//     update_context_menu_item("sub_never", !state.urls[state.url_index].always);
//   }
// }

// async function handle_cc_never_btn() {

//   // add_url() and remove_url() will save state
//   if (state.url_index > -1 && !state.urls[state.url_index].always) {
//     // url in list and always = false, so remove this url
//     await remove_url();
//   } else {
//     await add_url(false);
//   }

//   update_content();
//   update_popup();

//   if (state.url_index === -1) {
//     update_context_menu_item("sub_always", false);
//     update_context_menu_item("sub_never", false);
//   } else {
//     update_context_menu_item("sub_always", state.urls[state.url_index].always);
//     update_context_menu_item("sub_never", !state.urls[state.url_index].always);
//   }
// }

// async function handle_clear_btn() {
//   let active_tab = state.active_tab; // preserve active tab
//   state = {};

//   clear_storage();
//   await init_state();
//   state.active_tab = active_tab;
//   update_popup();
//   update_content();
// }

// function handle_swatch_btn(swatch) {
//   state.cc_toggle = true;

//   switch(state.active_btn) {
//     case "fore": {
//       update_chosen_color(state.fg, swatch.hue, swatch.saturation, swatch.lightness, swatch.id);
//     } break;
//     case "back": {
//       update_chosen_color(state.bg, swatch.hue, swatch.saturation, swatch.lightness, swatch.id);
//     } break;
//     case "link": {
//       update_chosen_color(state.li, swatch.hue, swatch.saturation, swatch.lightness, swatch.id);
//     } break;
//     default: break;
//   }

//   save_state();
//   update_content();
//   update_popup();
//   update_context_menu_item("change_colors", state.cc_toggle);
// }

function notify(request, sender, response) {
  switch (request.message) {
    default: break;
  }

  // if (msg.popup_request_state) {
  //   console.log('popup requesting state');
  //   get_state();
  // }
  // else if (msg.content_request_state) {
  //   get_state();
  // }
  // else if (msg.ccBtnState) {
  //   console.log('content returning btn state',msg.ccBtnState);
  //   state.cc_toggle = msg.ccBtnState;
  //   save_state();
  // }
  // if (msg.popup_new_state) {
  //   state = msg.popup_new_state;
  //   save_state();
  //   update_content();
  // }
  // else if (msg.save_state) {
  //   state = msg.save_state;
  //   save_state();
  // }

  // // buttons
  // else if (msg.handle_cc_btn) {
  //   state = msg.handle_cc_btn;
  //   handle_cc_btn();
  // }
  // else if (msg.handle_cc_always_btn) {
  //   state = msg.handle_cc_always_btn;
  //   handle_cc_always_btn(null);
  // }
  // else if (msg.handle_cc_never_btn) {
  //   state = msg.handle_cc_never_btn;
  //   handle_cc_never_btn(null);
  // }
  // else if (msg.handle_clear_btn) {
  //   handle_clear_btn();
  // }
  // else if (msg.handle_swatch_btn) {
  //   state = msg.handle_swatch_btn;
  //   handle_swatch_btn(msg.swatch);
  // }
}

async function tabActivated(tabInfo) {
  if (bIsChrome) {
    chrome.storage.local.set({ tabInfo });
    chrome.tabs.sendMessage(tabInfo.tabId, { message: 'updateContent' });
  } else {
    browser.storage.local.set({ tabInfo });
    browser.tabs.sendMessage(tabInfo.tabId, { message: 'updateContent' });
  }
}

if (bIsChrome) {
  chrome.runtime.onMessage.addListener(notify);
  chrome.tabs.onActivated.addListener(tabActivated);
} else {
  browser.runtime.onMessage.addListener(notify);
  browser.tabs.onActivated.addListener(tabActivated);
}