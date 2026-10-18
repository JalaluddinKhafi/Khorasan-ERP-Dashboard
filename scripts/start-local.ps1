param([switch]$SkipBuild)
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
Set-Location $project
if (!(Test-Path -LiteralPath '.env')) { throw 'Create .env from .env.example and set the passwords first.' }
Get-Content -LiteralPath '.env' | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1],$matches[2],'Process') } }
docker compose up -d db
if ($LASTEXITCODE -ne 0) { throw 'MySQL could not start.' }
$ready=$false
for ($attempt=0; $attempt -lt 45; $attempt++) {
    $dbId=docker compose ps -q db
    $health=docker inspect --format '{{.State.Health.Status}}' $dbId
    if ($health -eq 'healthy') { $ready=$true; break }
    Start-Sleep -Seconds 2
}
if (!$ready) { throw 'MySQL did not become healthy. Check docker compose logs db.' }
if (!$SkipBuild) { mvn -f backend/pom.xml package; if ($LASTEXITCODE -ne 0) { throw 'Build failed.' } }
# Docker owns the application independently of this terminal.
docker compose -f compose.yaml -f compose.local.yaml up -d --build app
if ($LASTEXITCODE -ne 0) { throw 'The application could not start. Check docker compose logs app.' }
$appReady=$false
for ($attempt=0; $attempt -lt 60; $attempt++) {
    try {
        $response=Invoke-WebRequest -Uri 'http://localhost:8082/api/csrf' -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) { $appReady=$true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (!$appReady) { throw 'The application did not become ready. Check docker compose logs app.' }
Write-Host 'Application running: http://localhost:8082/dashboard/login.html'
Write-Host 'Closing this terminal does not stop the application.'
Write-Host 'Stop when needed: docker compose stop app'
