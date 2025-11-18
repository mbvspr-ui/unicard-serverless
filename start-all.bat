@echo off
echo ========================================
echo Starting Unicard Serverless System
echo ========================================
echo.

echo Starting API Server (Port 3001)...
start "API Server" cmd /k "cd api && set NODE_TLS_REJECT_UNAUTHORIZED=0 && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting School Portal (Port 3000)...
start "School Portal" cmd /k "cd school-portal && npm run dev"

timeout /t 2 /nobreak > nul

echo Starting Admin Portal (Port 3002)...
start "Admin Portal" cmd /k "cd admin-portal && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo API Server:     http://localhost:3001
echo School Portal:  http://localhost:3000
echo Admin Portal:   http://localhost:3002
echo.
echo Admin Login:
echo   Email: admin@unicard.com
echo   Password: Admin@123456
echo.
echo Press any key to exit...
pause > nul
