# Pull external/game_common, then copy client config, net_pb.json, and proto into assets/resources.
# After this script installs the submodule post-checkout hook, git submodule update does the copy itself.
param(
    [switch]$CopyOnly
)

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

function Install-GameCommonHook {
    $gitDir = (git -C $source rev-parse --absolute-git-dir).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $gitDir) {
        throw "external/game_common has no git directory."
    }
    $hookDir = Join-Path $gitDir "hooks"
    New-Item -ItemType Directory -Force -Path $hookDir | Out-Null
    $hookSrc = Join-Path $root "tools\githooks\game-common-post-checkout"
    $hookText = [System.IO.File]::ReadAllText($hookSrc) -replace "`r`n", "`n" -replace "`r", "`n"
    if (-not $hookText.EndsWith("`n")) {
        $hookText += "`n"
    }
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Join-Path $hookDir "post-checkout"), $hookText, $utf8)
}

if (-not $CopyOnly) {
    $env:GAME_COMMON_SYNC = "1"
    git -C $root submodule update --init --remote -- external/game_common
    if ($LASTEXITCODE -ne 0) {
        throw "git submodule update --remote external/game_common failed."
    }
    Install-GameCommonHook
}

if (-not (Test-Path (Join-Path $source ".git"))) {
    throw "external/game_common is missing. Run: git submodule update --init external/game_common"
}

$env:GAME_COMMON_SYNC = "1"
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

$protoNames = @(Get-ChildItem $protoSrc -Filter *.proto | ForEach-Object { $_.Name })
Get-ChildItem $protoDst -Filter *.proto | Where-Object { $protoNames -notcontains $_.Name } | ForEach-Object {
    Remove-Item $_.FullName -Force
    if (Test-Path "$($_.FullName).meta") {
        Remove-Item "$($_.FullName).meta" -Force
    }
}

Get-ChildItem $configDst -Filter *.json | ForEach-Object { New-AssetMeta $_.FullName "json" "2.0.1" }
Get-ChildItem $protoDst -Filter *.proto | ForEach-Object { New-AssetMeta $_.FullName "text" "1.0.1" }
New-AssetMeta $netPbDst "json" "2.0.1"

Write-Host "Synced config, net_pb.json, and proto from external/game_common"
