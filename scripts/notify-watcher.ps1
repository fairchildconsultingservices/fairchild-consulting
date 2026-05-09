# Cowork sentinel-file watcher.
# Polls the sentinel file every 3 seconds; whenever its timestamp changes,
# fires notify-portfolio.ps1 to alert you that Claude finished a step.
#
# Install once: drop a shortcut to this script in your Startup folder
#   shortcut target: powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\fairc\Documents\Claude\Projects\Portfolio Webpage - Fairchild Consulting Services\scripts\notify-watcher.ps1"
#   or run manually: right-click -> Run with PowerShell

$sentinel = "C:\Users\fairc\Documents\Claude\Projects\Portfolio Webpage - Fairchild Consulting Services\.cowork-done"
$notify   = "C:\Users\fairc\Documents\notify-portfolio.ps1"

$lastWrite = if (Test-Path $sentinel) { (Get-Item $sentinel).LastWriteTime } else { [DateTime]::MinValue }

Write-Host "Cowork notify watcher started. Sentinel: $sentinel"

while ($true) {
    Start-Sleep -Seconds 3
    if (Test-Path $sentinel) {
        $current = (Get-Item $sentinel).LastWriteTime
        if ($current -gt $lastWrite) {
            $lastWrite = $current
            try {
                & $notify "Portfolio"
            } catch {
                Write-Warning ("notify-portfolio.ps1 failed: " + $_.Exception.Message)
            }
        }
    }
}
