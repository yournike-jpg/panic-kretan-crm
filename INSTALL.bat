@echo off
echo ============================================
echo   CRM System - The Kretan ^& Panic Sweets
echo   Installing...
echo ============================================
echo.
cd /d "%~dp0"
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo Installing packages (this may take a minute)...
npm install
echo.
if %errorlevel% neq 0 (
    echo ============================================
    echo   ERROR: Installation failed!
    echo   Make sure Node.js is installed from nodejs.org
    echo ============================================
) else (
    echo ============================================
    echo   Installation complete!
    echo   Now double-click START.bat to run the CRM.
    echo ============================================
)
echo.
pause
