@echo off
chcp 65001 >nul
echo ========================================
echo   术后疼痛智能管理系统 - 重置数据库
echo ========================================
echo.
echo 警告: 此操作将删除所有数据并恢复初始示例数据！
echo.
set /p confirm=确认重置？(输入Y确认): 
if /i not "%confirm%"=="Y" (
    echo 已取消。
    pause
    exit /b
)
echo.
echo [1/3] 停止后端服务...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul
echo.
echo [2/3] 删除旧数据库...
del /f /q "%~dp0backend\db\healthcare.db" >nul 2>&1
echo.
echo [3/3] 重新启动后端（自动重建数据库）...
cd /d "%~dp0backend"
start "后端服务-3001" cmd /k "node server.js"
echo.
echo ========================================
echo 数据库已重置！后端已重新启动。
echo ========================================
echo.
pause
