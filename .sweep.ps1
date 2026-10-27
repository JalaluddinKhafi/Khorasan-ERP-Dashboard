$ErrorActionPreference = 'SilentlyContinue'
Set-Location 'e:\Amini\khorasan-system'
$browser = 'C:\Users\Khafi\.codegpt\skills\browser-automation\browser.mjs'
$pages = Get-ChildItem dashboard,public-site -Filter *.html | ForEach-Object { "$($_.Directory.Name)/$($_.Name)" }
$lines = @()
foreach ($p in $pages) {
    $out = node $browser "http://127.0.0.1:8765/$p" --script "e:\Amini\khorasan-system\.qa-resp.mjs" 2>&1 | Out-String
    $ov = [regex]::Matches($out, '"overflow":\s*(-?\d+)') | ForEach-Object { [int]$_.Groups[1].Value }
    $status = if (($ov | Where-Object { $_ -ne 0 }).Count -eq 0) { 'OK  ' } else { 'FAIL' }
    $lines += ("{0} {1,-42} [{2}]" -f $status, $p, ($ov -join ','))
}
$lines | Set-Content -Path '.sweep-result.txt' -Encoding utf8
