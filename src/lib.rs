#[macro_use]
mod util;

use wasm_bindgen::prelude::*;
use web_sys::*;

#[wasm_bindgen(start)]
pub async fn main() {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
    let window = web_sys::window().expect("Could not get the window.");
    let storage = window
        .local_storage()
        .expect("Could not get local storage")
        .expect("Could not unwrap local storage");

    let hosts: Vec<String> = match storage
        .get("hosts")
        .expect("Error occured with getting storage key.")
    {
        Some(hosts) => {
            serde_json::from_str(&hosts).expect("Could not deserialize hosts to Vec<String>.")
        }
        None => vec![],
    };
    log!("hosts: {:?}", hosts);
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
