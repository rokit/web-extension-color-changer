#[macro_use]
mod util;

use wasm_bindgen::prelude::*;
use web_sys::*;

pub struct ColorChanger {
    pub hosts: Vec<String>,
}

impl ColorChanger {
    pub fn new() -> ColorChanger {
        ColorChanger { hosts: Vec::new() }
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

    let mut color_changer = ColorChanger::new();

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

    let hosts: Vec<String> = match storage
        .get("hosts")
        .expect("Error occured with getting storage key.")
    {
        Some(hosts) => {
            serde_json::from_str(&hosts).expect("Could not deserialize hosts to Vec<String>.")
        }
        None => vec![],
    };

    color_changer.hosts = hosts;

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
