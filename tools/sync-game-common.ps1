# Sync client config, net_pb.json, and proto from the game_common submodule.
# The submodule stays in external/ and is not packed. Copied files land in assets/resources.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "external\game_common"
$configSrc = Join-Path $source "client\res"
$protoSrc = Join-Path $source "proto"
$netPbSrc = Join-Path $source "client\net_pb.json"
$configDst = Join-Path $root "assets\resources\config"
$protoDst = Join-Path $root "assets\resources\protbuf\pto"
$netPbDst = Join-Path $root "assets\resources\protbuf\net_pb.json"
$oldNetPb = Join-Path $root "assets\resources\protbuf\netPb.json"

if (-not (Test-Path (Join-Path $source ".git"))) {
    throw "external/game_common is missing. Run: git submodule update --init external/game_common"
}
git -C $source sparse-checkout set client proto
if (-not (Test-Path $netPbSrc)) {
    throw "external/game_common is missing client/net_pb.json."
}

function New-AssetMeta([string]$assetPath, [string]$importer, [string]$ver) {
    $metaPath = "$assetPath.meta"
    if (Test-Path $metaPath) { return }
    $uuid = [guid]::NewGuid().ToString()
    $content = @"
{
  "ver": "$ver",
  "importer": "$importer",
  "imported": true,
  "uuid": "$uuid",
  "files": [
    ".json"
  ],
  "subMetas": {},
  "userData": {}
}
"@
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($metaPath, $content.TrimStart() + "`n", $utf8)
}

New-Item -ItemType Directory -Force -Path $configDst, $protoDst | Out-Null

if ((Test-Path $oldNetPb) -and -not (Test-Path $netPbDst)) {
    Move-Item $oldNetPb $netPbDst
    if (Test-Path "$oldNetPb.meta") {
        Move-Item "$oldNetPb.meta" "$netPbDst.meta"
    }
}

Copy-Item (Join-Path $configSrc "*.json") $configDst -Force
Copy-Item (Join-Path $protoSrc "*.proto") $protoDst -Force
Copy-Item $netPbSrc $netPbDst -Force

Get-ChildItem $configDst -Filter *.json | ForEach-Object { New-AssetMeta $_.FullName "json" "2.0.1" }
Get-ChildItem $protoDst -Filter *.proto | ForEach-Object { New-AssetMeta $_.FullName "text" "1.0.1" }
New-AssetMeta $netPbDst "json" "2.0.1"

Write-Host "Synced config, net_pb.json, and proto from external/game_common"
