@echo off
REM Enhanced Photo Editor - Test Runner Script (Windows)
REM This script sets up and runs the tests for the photo editor

echo =========================================
echo Enhanced Photo Editor - Test Runner
echo =========================================
echo.

REM Check if we're in the right directory
if not exist package.json (
    echo Error: package.json not found. Please run this script from unicard-serverless\school-portal directory
    exit /b 1
)

echo Found package.json
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo node_modules not found. Running npm install...
    call npm install
)

echo Installing test dependencies...
echo.

REM Install testing dependencies
call npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitest/ui

echo.
echo Test dependencies installed
echo.

echo Running tests...
echo.

REM Run tests
call npm run test:run

echo.
echo =========================================
echo Test run complete!
echo =========================================

pause
