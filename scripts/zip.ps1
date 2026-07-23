# create zip files for submission

# get manifest
$manifest = Get-Content ".\dist\manifest.json" | ConvertFrom-Json;
Write-Host "manifest version: $($manifest.version)";

$browser = "chrome";
if ($manifest.browser_specific_settings.gecko.id -eq "@colorchanger") {
    $browser = "firefox";
}

Write-Host "browser: $browser";

# create folder
$destinationFolder = ".\zips";
md -Force $destinationFolder;

# set destination path
$destinationPath = $destinationFolder + "\" + "${browser}-" + $manifest.version;

# create zips
Compress-Archive -Path ".\dist\*" -DestinationPath ($destinationPath + ".zip") -Force
Compress-Archive -Path ".\src\*" -DestinationPath ($destinationPath + ".source.zip") -Force