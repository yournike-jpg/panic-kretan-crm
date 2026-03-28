@echo off
echo ============================================
echo   CRM System - The Kretan ^& Panic Sweets
echo   Starting server...
echo ============================================
echo.
cd /d "%~dp0"
echo   Opening CRM in your browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000
node server.js
pause
