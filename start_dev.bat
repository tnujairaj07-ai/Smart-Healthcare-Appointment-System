@echo off
echo ===================================================
echo Starting NovaCare OS Development Environment...
echo ===================================================

:: Start Flask Backend in a separate window
echo Launching Flask API Backend (Port 5000)...
start "NovaCare Backend Server" cmd /k "cd /d %~dp0 && venv\Scripts\python.exe backend/app.py"

:: Start Vite React Frontend in the current window
echo Launching Vite React Frontend (Port 5173)...
cd /d %~dp0\frontend
npm run dev
