<#
.SYNOPSIS
  Vigila tasks/inbox y ejecuta un agente CLI por cada archivo .md nuevo.
.EXAMPLE
  ./watch_tasks.ps1
  ./watch_tasks.ps1 -Agent claude -PollSeconds 5
#>
param(
  [ValidateSet('agy', 'claude')]
  [string]$Agent = $(if ($env:TASK_AGENT) { $env:TASK_AGENT } else { 'agy' }),
  [int]$PollSeconds = 3
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Root = $PSScriptRoot
$InboxDir = Join-Path $Root 'tasks/inbox'
$CompletedDir = Join-Path $Root 'tasks/completed'
$FailedDir = Join-Path $Root 'tasks/failed'
$LogsDir = Join-Path $Root 'tasks/logs'

foreach ($dir in $InboxDir, $CompletedDir, $FailedDir, $LogsDir) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

if (-not (Get-Command $Agent -ErrorAction SilentlyContinue)) {
  Write-Error "No se encontró '$Agent' en el PATH. Instálalo o usa -Agent con otro valor."
  exit 1
}

function Test-FileReady([string]$Path) {
  # Evita procesar un archivo que el editor aún está escribiendo
  try {
    $stream = [System.IO.File]::Open($Path, 'Open', 'Read', 'None')
    $stream.Close()
    return $true
  } catch {
    return $false
  }
}

function Invoke-Task([System.IO.FileInfo]$File) {
  $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
  $relative = "tasks/inbox/$($File.Name)"
  $logFile = Join-Path $LogsDir "${timestamp}_$($File.BaseName).log"

  Write-Host ''
  Write-Host '=========================================='
  Write-Host "[TAREA] Nueva tarea detectada: $($File.Name)"
  Write-Host '=========================================='

  $brandRule = if (Test-Path (Join-Path $Root 'docs/ualdo-brand.md')) { ' Sigue estrictamente docs/ualdo-brand.md y usa solo los assets de docs/brand-assets.' } else { '' }
  $prompt = "Actúa como desarrollador principal. Lee el archivo '$relative' con los requerimientos, implementa todo el código necesario en el proyecto, ejecuta las pruebas y asegura que la solución funcione correctamente. Nunca uses emojis en ninguna parte.$brandRule No modifiques ni muevas archivos dentro de tasks/."

  # En PowerShell 5.1, con 'Stop', cualquier línea del agente en stderr lanzaría
  # NativeCommandError y mataría el vigilante; el éxito se juzga por el exit code.
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  Push-Location $Root
  try {
    & $Agent -p $prompt --dangerously-skip-permissions 2>&1 | ForEach-Object {
      $line = "$_"
      Add-Content -LiteralPath $logFile -Value $line -Encoding UTF8
      $line
    }
    $exitCode = $LASTEXITCODE
  } finally {
    Pop-Location
    $ErrorActionPreference = $previousPreference
  }

  $targetDir = if ($exitCode -eq 0) { $CompletedDir } else { $FailedDir }
  $target = Join-Path $targetDir "${timestamp}_$($File.Name)"
  Move-Item -LiteralPath $File.FullName -Destination $target

  if ($exitCode -eq 0) {
    Write-Host "[OK] Tarea completada y archivada en: $target"
  } else {
    Write-Host "[ERROR] El agente terminó con código $exitCode. Tarea movida a: $target (log: $logFile)"
  }
}

Write-Host "Vigilante de tareas activo (agente: $Agent)."
Write-Host "Deposita archivos .md en: $InboxDir"
Write-Host '   Ctrl+C para detener.'

while ($true) {
  $pending = Get-ChildItem -LiteralPath $InboxDir -Filter '*.md' -File | Sort-Object Name
  foreach ($file in $pending) {
    if (Test-FileReady $file.FullName) {
      try {
        Invoke-Task $file
      } catch {
        # Un fallo inesperado nunca debe tumbar el vigilante ni dejar la tarea en bucle
        Write-Host "[ERROR] Fallo inesperado procesando $($file.Name): $($_.Exception.Message)"
        if (Test-Path -LiteralPath $file.FullName) {
          $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
          Move-Item -LiteralPath $file.FullName -Destination (Join-Path $FailedDir "${stamp}_$($file.Name)")
        }
      }
      Write-Host 'Esperando nuevas tareas...'
    }
  }
  Start-Sleep -Seconds $PollSeconds
}
