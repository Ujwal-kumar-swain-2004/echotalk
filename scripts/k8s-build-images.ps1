param(
    [string]$BackendImage = "echotalk-backend:latest",
    [string]$FrontendImage = "echotalk-frontend:latest"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

docker build -t $BackendImage (Join-Path $RepoRoot "backend")
docker build `
    --build-arg VITE_API_URL=/api `
    --build-arg VITE_SOCKET_URL= `
    --build-arg VITE_TURN_URLS=turn:localhost:30478?transport=udp,turn:localhost:30478?transport=tcp `
    --build-arg VITE_TURN_USERNAME=echotalk `
    --build-arg VITE_TURN_CREDENTIAL=change-this-turn-password `
    -t $FrontendImage `
    (Join-Path $RepoRoot "frontend")

Write-Host "Built $BackendImage and $FrontendImage"
