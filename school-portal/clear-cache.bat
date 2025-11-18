@echo off
echo ========================================
echo Fixing React Module Resolution Issues
echo ========================================
echo.
echo Step 1: Clearing Vite cache...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "dist" rmdir /s /q "dist"
echo Cache cleared!
echo.
echo Step 2: Reinstalling dependencies...
call npm install
echo.
echo Step 3: Starting dev server...
echo ========================================
call npm run dev
