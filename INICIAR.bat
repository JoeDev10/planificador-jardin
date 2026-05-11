@echo off
echo Iniciando Planificador Jardin...
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.

start "Backend" cmd /k "cd /d D:\proyectos 2.0\app planificacion jardin\backend && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend" cmd /k "cd /d D:\proyectos 2.0\app planificacion jardin\frontend && npm run dev"
timeout /t 4 /nobreak > nul
start chrome http://localhost:5173
