// require fs module
const fs = require("fs");

var args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Specify manifest.ff.json or manifest.chrome.json.");
  return;
}

const source = args[0];
const manifestJson = "manifest.json";

// copy contents from source file to destination file
fs.copyFile(source, manifestJson, (error) => {
  if (error) {
    console.error(error);
    return;
  }

  console.log(`Copied contents of ${source} to ${manifestJson}`);
});