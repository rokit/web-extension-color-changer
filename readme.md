# Color Changer Web Extension

## Build steps (Windows)

Built with Node 16.13.1, though it should work with the latest LTS version.

1. Clone the project: `git clone git@github.com:rokit/web-extension-color-changer.git`.
1. Navigate to the root of the folder and run `npm i`.
1. Run `npm run build:ff` for Firefox or `npm run build:chrome` for Chrome. Parcel should create a `dist` folder.
1. Load the extension from the `dist` folder.
