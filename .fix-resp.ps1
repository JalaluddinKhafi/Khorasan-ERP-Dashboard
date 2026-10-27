$ErrorActionPreference = 'Stop'
$path = (Resolve-Path 'assets/css/style.css').Path
$t = [System.IO.File]::ReadAllText($path)

# locate by ASCII anchors, then back up to the start of each comment block
$a = $t.IndexOf('RESPONSIVE STYLES')
$b = $t.IndexOf('CUSTOM STYLES')
if ($a -lt 0 -or $b -lt 0) { throw "anchors missing a=$a b=$b" }

$s = $t.LastIndexOf('/* ====', $a)
$e = $t.LastIndexOf('/* ====', $b)
if ($s -lt 0 -or $e -lt 0 -or $e -le $s) { throw "comment blocks not found s=$s e=$e" }

$head = $t.Substring(0, $s)
$keep = $t.Substring($e)

$new = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '.resp-block.css')

$result = $head + $new + "`r`n" + $keep
[System.IO.File]::WriteAllText($path, $result, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "ok: $($t.Length) -> $($result.Length)"
