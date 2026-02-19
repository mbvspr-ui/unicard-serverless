@echo off
echo ========================================
echo Checking Staff Management Files
echo ========================================
echo.

echo Checking School Portal Files...
echo.

if exist "school-portal\src\pages\AddStaff.tsx" (
    echo [OK] AddStaff.tsx exists
) else (
    echo [MISSING] AddStaff.tsx NOT FOUND
)

if exist "school-portal\src\pages\StaffList.tsx" (
    echo [OK] StaffList.tsx exists
) else (
    echo [MISSING] StaffList.tsx NOT FOUND
)

if exist "school-portal\src\pages\EditStaff.tsx" (
    echo [OK] EditStaff.tsx exists
) else (
    echo [MISSING] EditStaff.tsx NOT FOUND
)

if exist "school-portal\src\lib\api.ts" (
    echo [OK] api.ts exists
) else (
    echo [MISSING] api.ts NOT FOUND
)

if exist "school-portal\src\types\index.ts" (
    echo [OK] types/index.ts exists
) else (
    echo [MISSING] types/index.ts NOT FOUND
)

if exist "school-portal\src\App.tsx" (
    echo [OK] App.tsx exists
) else (
    echo [MISSING] App.tsx NOT FOUND
)

echo.
echo Checking for staffApi in api.ts...
findstr /C:"staffApi" school-portal\src\lib\api.ts >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] staffApi found in api.ts
) else (
    echo [MISSING] staffApi NOT found in api.ts
)

echo.
echo Checking for Staff routes in App.tsx...
findstr /C:"path=\"/staff\"" school-portal\src\App.tsx >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Staff routes found in App.tsx
) else (
    echo [MISSING] Staff routes NOT found in App.tsx
)

echo.
echo Checking for Staff in BottomNav...
findstr /C:"Staff" school-portal\src\components\BottomNav.tsx >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Staff menu item found in BottomNav
) else (
    echo [MISSING] Staff menu item NOT found in BottomNav
)

echo.
echo ========================================
echo Check Complete!
echo ========================================
echo.
echo If all checks show [OK], the staff pages should work.
echo.
echo To test:
echo 1. Open http://localhost:3000
echo 2. Login with school credentials
echo 3. Click "Staff" in navigation
echo.
pause
