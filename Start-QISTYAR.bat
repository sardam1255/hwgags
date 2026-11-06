@echo off
chcp 65001 >nul
title QISTYAR - سیستەمی بەڕێوەبردنی قیست
echo ===================================================================
echo   سیستەمی بەڕێوەبردنی قیست و سەرمایە (QISTYAR)
echo   دەستپێکردنی سیستەم لەسەر کۆمپیوتەرەکەت (Local Server)...
echo ===================================================================
echo.

set PORT=3000
set IS_DESKTOP_EXE=true
set OPEN_BROWSER=true

if exist "QISTYAR.exe" (
    echo دۆزینەوەی فایلی بەڕێوەبردنی QISTYAR.exe...
    start "" "http://localhost:3000"
    QISTYAR.exe
) else (
    echo پشکنینی ژینگەی Node.js لەسەر کۆمپیوتەرەکەت...
    where node >nul 2>nul
    if %errorlevel% neq 0 (
        echo [!] تێبینی: Node.js نەدۆزرایەوە. تکایە سەرەتا Node.js دابمەزرێنە لە https://nodejs.org
        pause
        exit /b
    )
    if not exist "node_modules" (
        echo دامەزراندنی پاکێجەکان بۆ یەکەمجار...
        call npm install
    )
    if not exist "dist" (
        echo دروستکردنی فایلی وێبی پرۆژەکە (Build)...
        call npm run build
    )
    echo کردنەوەی وێبگەڕ (Browser) لەسەر http://localhost:3000 ...
    start "" "http://localhost:3000"
    call npm start
)

pause
