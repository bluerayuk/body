@echo off
cd /d F:\app\New

echo ============================================================
echo Bodybuilding ^& TDEE Tracker - Native Desktop App
echo ============================================================

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo.
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        echo Make sure Python is installed and in PATH
        pause
        exit /b 1
    )
    
    call venv\Scripts\activate.bat
    
    echo.
    echo Installing required packages...
    pip install pywebview==5.0 pywin32>=305
    if errorlevel 1 (
        echo ERROR: Failed to install requirements
        pause
        exit /b 1
    )
    
    echo.
    echo Running post-install script for pywin32...
    python venv\Scripts\pywin32_postinstall.py -install
    
    echo.
    echo Setup complete!
) else (
    call venv\Scripts\activate.bat
)

echo.
echo Starting Native Desktop Application...
echo.

REM Start the native app
python main.py

REM If app closes with error, keep window open
if errorlevel 1 (
    echo.
    echo ERROR: Application exited with error
    pause
)