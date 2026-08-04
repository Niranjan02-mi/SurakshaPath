@echo off
echo Starting SurakshaPath Tourist System...
echo This might take a minute on the first run as it builds the Docker images.

docker-compose up -d --build

echo.
echo ========================================================
echo ✅ System is running!
echo 🌐 Open your browser and go to: http://localhost:5173
echo ========================================================
echo.
pause
