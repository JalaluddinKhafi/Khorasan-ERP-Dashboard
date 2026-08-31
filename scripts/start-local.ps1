$ready=$false
for ($attempt=0; $attempt -lt 45; $attempt++) {
    $dbId=docker compose ps -q db
    $health=docker inspect --format '{{.State.Health.Status}}' $dbId
    if ($health -eq 'healthy') { $ready=$true; break }
    Start-Sleep -Seconds 2
}
if (!$ready) { throw 'MySQL did not become healthy. Check docker compose logs db.' }
