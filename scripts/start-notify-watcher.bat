@echo off
REM Double-click this to start the Cowork notify watcher.
REM Leave the window open while you work with Claude.

echo Starting Cowork notify watcher...
echo.
echo Leave this window open. Close it to stop notifications.
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0notify-watcher.ps1"

pause
