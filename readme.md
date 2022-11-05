# Color Changer Web Extension

## Build steps (Windows)

Built with Node 16.13.1, though it should work with the latest LTS version.

1. Clone the project: `git clone git@github.com:rokit/web-extension-color-changer.git`.
1. Navigate to the root of the folder and run `npm i`.
1. Create a `dist` folder.
1. Add an environment variable called `COLOR_CHANGER_DIST` that points to the `dist` folder. The value should look something like this:
   - `C:\path\to\web-extension-color-changer\dist\*`
   - Keep the asterisk at the end.
1. Create a `manifest.json` in the root and paste in the contents from `manifest.ff.json` for Firefox or `manifest.chrome.json` for Chrome.
1. Run `npm run build` (requires PowerShell). Parcel should add files to the `dist` folder.
1. Load the extension from the `dist` folder.
