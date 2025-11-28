@echo off
REM Setup and run both backend (FastAPI) and frontend (Vite) from pk-hack folder

setlocal enabledelayedexpansion

REM Install Python dependencies for FastAPI backend
echo.
echo ============================================
echo Installing Python backend dependencies...
echo ============================================
py -m pip install -r requirements.txt --quiet

if errorlevel 1 (
    echo Error installing Python dependencies
    exit /b 1
)

REM Install Node dependencies for React frontend
echo.
echo ============================================
echo Installing Node frontend dependencies...
echo ============================================
npm.cmd install --silent

if errorlevel 1 (
    echo Error installing Node dependencies
    exit /b 1
)

echo.
echo ============================================
echo Setup complete! Starting servers...
echo ============================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.

REM Start both servers
echo Starting FastAPI backend on port 8000...
start "FastAPI Backend" cmd /k "py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Vite frontend on port 5173...
start "Vite Frontend" cmd /k "npm.cmd run dev"

echo.
echo Both servers started. Press any key to open the frontend in browser...
pause

REM Open frontend in default browser
start http://localhost:5173

endlocal
