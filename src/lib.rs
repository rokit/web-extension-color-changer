#[macro_use]
mod util;

use js_sys::Function;
use serde::Deserialize;
use serde::Serialize;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;

// static mut STATE: ColorChanger = ColorChanger::new();
pub const COLOR_CHANGER_STORAGE: &str = "color_changer_i9XOynEn";
pub const COLOR_CHANGER_CLASS_NAME: &str = "color-changer-i9XOynEn";

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Hsl {
    // degrees 0-360
    pub hue: u32,
    // 0-100%
    pub saturation: u32,
    // 0-100%
    pub lightness: u32,
}

impl Hsl {
    pub fn black() -> Hsl {
        Hsl {
            hue: 0,
            saturation: 0,
            lightness: 0,
        }
    }

    pub fn white() -> Hsl {
        Hsl {
            hue: 0,
            saturation: 0,
            lightness: 100,
        }
    }

    pub fn blue() -> Hsl {
        Hsl {
            hue: 223,
            saturation: 54,
            lightness: 34,
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, Serialize, Deserialize)]
pub struct ColorChangerState {
    hosts: Vec<String>,
    pub change_colors: bool,
    pub always: bool,
    /// foreground
    pub fg: Hsl,
    /// background
    pub bg: Hsl,
    /// links
    pub li: Hsl,
}

#[wasm_bindgen]
impl ColorChangerState {
    pub fn new() -> ColorChangerState {
        ColorChangerState {
            hosts: Vec::new(),
            change_colors: false,
            always: false,
            fg: Hsl::black(),
            bg: Hsl::white(),
            li: Hsl::blue(),
        }
    }

    pub fn should_change_colors(&self, hostname: &str) -> bool {
        let hostname = hostname.to_owned();
        if self.hosts.contains(&hostname) {
            log!("change colors");
            return true;
        }
        log!("do not change colors");
        false
    }
}

#[wasm_bindgen]
#[derive(Debug)]
pub struct ColorChanger {
    state: ColorChangerState,
    obs: MutationObserver,
}

#[wasm_bindgen]
impl ColorChanger {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ColorChanger {
        std::panic::set_hook(Box::new(console_error_panic_hook::hook));

        add_color_changer_class();

        let window = web_sys::window().expect("Could not get the window.");
        let storage = window
            .local_storage()
            .expect("Could not get local storage")
            .expect("Could not unwrap local storage");

        let document = window.document().expect("Could not get document.");

        // hostname does not include the port, e.g., developer.mozilla.org.
        let hostname = document
            .location()
            .expect("Could not get location.")
            .hostname()
            .expect("Could not get hostname.");

        // Get the storage.
        let color_changer = match storage.get(COLOR_CHANGER_STORAGE) {
            Ok(Some(color_changer_storage)) => match serde_json::from_str(&color_changer_storage) {
                Ok(cc) => cc,
                Err(e) => {
                    log!("Could not deserialize Color Changer from storage. Creating default color changer.");
                    ColorChangerState::new()
                }
            },
            Ok(None) => {
                log!("Color changer was None in storage. Creating default color changer.");
                ColorChangerState::new()
            }
            Err(e) => {
                log!("Error when initializing color changer from storage. Creating default color changer. Error: {:?}", e);
                ColorChangerState::new()
            }
        };

        // Set the storage for cases where Color Changer is just now being created.
        match storage.set(
            COLOR_CHANGER_STORAGE,
            &serde_json::to_string(&color_changer).unwrap(),
        ) {
            Ok(()) => {
                log!("Successfully saved color changer to storage.")
            }
            Err(e) => log!("Error when saving color changer to storage: {:?}", e),
        };

        color_changer.should_change_colors(&hostname);

        let mutation_closure =
            Closure::wrap(Box::new(mutation_callback)
                as Box<dyn FnMut(Vec<MutationRecord>, MutationObserver)>);

        // let mutation_closure: Function = mutation_callback;
        let mutation_observer = MutationObserver::new(mutation_closure.as_ref().unchecked_ref())
            .expect("Could not create mutation observer.");
        mutation_closure.forget();

        let mut observer_config = MutationObserverInit::new();
        observer_config.attribute_filter(&JsValue::from_serde(&["class"]).unwrap());

        let html = document
            .document_element()
            .expect("Could not get html element.");

        mutation_observer
            .observe_with_options(&html, &observer_config)
            .expect("Could not start observer.");

        log!("hostname: {:?}", hostname);
        log!("hosts: {:?}", color_changer.hosts);
        log!("hello");

        ColorChanger {
            state: color_changer,
            obs: mutation_observer,
        }
    }
}

// #[wasm_bindgen(start)]
// pub async fn main() {

// }

pub fn mutation_callback(mutation_records: Vec<MutationRecord>, observer: MutationObserver) {
    for record in mutation_records {
        log!("observer: {:?}", observer);
        log!("mutation record: {:?}", record);
    }

    add_color_changer_class();
}

/// Only adds class if it doesn't exist.
pub fn add_color_changer_class() {
    let window = web_sys::window().expect("Could not get the window.");
    let document = window.document().expect("Could not get document.");
    let html = document
        .document_element()
        .expect("Could not get html element.");

    let class_list = html.class_list();

    if !class_list.contains(COLOR_CHANGER_CLASS_NAME) {
        let jsv = JsValue::from_serde(&[COLOR_CHANGER_CLASS_NAME])
            .expect("Could not create array JsValue for class.");
        class_list
            .add(&js_sys::Array::from(&jsv))
            .expect("Could not add class to html.");
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}
