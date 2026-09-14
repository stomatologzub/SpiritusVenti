param(
    [string]$ListenAddress = '127.0.0.1',
    [ValidateRange(1024, 65535)][int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$serverPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $serverPython)) {
    throw 'Python environment missing. Follow README.md to install dependencies.'
}
& $serverPython manage.py check
if ($LASTEXITCODE -ne 0) { throw 'Django configuration check failed.' }
& $serverPython manage.py collectstatic --noinput
if ($LASTEXITCODE -ne 0) { throw 'Static file collection failed.' }
Write-Host "Starting website at http://${ListenAddress}:${Port}. Press Ctrl+C to stop."
& $serverPython -m waitress "--listen=${ListenAddress}:${Port}" config.wsgi:application
