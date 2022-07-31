#[macro_use]
mod util;

use serde::Deserialize;
use serde::Serialize;

use wasm_bindgen::prelude::*;
use web_sys::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct ColorChanger {
    pub hosts: Vec<String>,
    pub change_colors: bool,
    pub always: bool,
}

pub const COLOR_CHANGER_STORAGE: &str = "color_changer_storage";

impl ColorChanger {
    pub fn new() -> ColorChanger {
        ColorChanger {
            hosts: Vec::new(),
            change_colors: false,
            always: false,
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

#[wasm_bindgen(start)]
pub async fn main() {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));

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
        Ok(Some(cc)) => {
            serde_json::from_str(&cc).expect("Could not deserialize Color Changer from storage.")
        }
        Ok(None) => {
            log!("Color changer was in storage, but could not be deserialized. Creating color changer with default values.");
            ColorChanger::new()
        }
        Err(e) => {
            log!("Error when initializing color changer from storage. Creating color changer with default values.");
            ColorChanger::new()
        }
    };

    // Set the storage for cases where Color Changer is just now being created.
    match storage.set(
        COLOR_CHANGER_STORAGE,
        &serde_json::to_string(&color_changer).unwrap(),
    ) {
        Ok(()) => {
            log!("success")
        }
        Err(e) => log!("Error when setting color changer storage: {:?}", e),
    };

    color_changer.should_change_colors(&hostname);
    log!("hostname: {:?}", hostname);
    log!("hosts: {:?}", color_changer.hosts);
    log!("hello");
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}
