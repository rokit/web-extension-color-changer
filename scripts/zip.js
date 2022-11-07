require('dotenv').config()
const { exec } = require('child_process');

var args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Specify chrome or firefox.");
  return;
}

let browser = args[0];

exec(`# create zip files for submission
#
#

# get manifest
$manifest = Get-Content manifest.json | ConvertFrom-Json; $manifest.version;

# create folder
$destinationFolder = "${process.env.COLOR_CHANGER_ZIP_DESTINATION_FOLDER}" + $manifest.version;
md -Force $destinationFolder;

# set destination path
$destinationPath  = $destinationFolder + "\\" + "${browser}." + $manifest.version + ".zip";

# create web extension zip
Compress-Archive -Path "${process.env.COLOR_CHANGER_FILES_TO_ZIP}" -DestinationPath $destinationPath -Force

# get source files
# ensure master is pulled
$files = Get-ChildItem -Path "${process.env.COLOR_CHANGER_SOURCE_FOLDER}" -Exclude @(".git")
$destinationSourcePath  = $destinationFolder + "\\" + "${browser}." + $manifest.version + ".source.zip";

# create source zip
Compress-Archive -Path $files -DestinationPath $destinationSourcePath -Force
`, { 'shell': 'powershell.exe' }, (error, stdout, stderr) => {
  console.log('stdout', stdout);
  console.log('error', error);
})