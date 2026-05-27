@echo off
chcp 65001 >nul
echo ========================================
echo   术后疼痛智能管理系统 - 停止服务
echo ========================================
echo.
echo 正在停止所有Node.js进程...
taskkill /F /IM node.exe >nul 2>&1
echo.
echo 所有服务已停止！
echo.
pause
