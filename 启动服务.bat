@echo off
chcp 65001 >nul
echo ========================================
echo   术后疼痛智能管理系统 - 启动服务
echo ========================================
echo.
echo [1/2] 正在启动后端服务...
cd /d "%~dp0backend"
start "后端服务-3001" cmd /k "node server.js"
echo 后端已启动 (端口3001)
echo.
timeout /t 2 /nobreak >nul
echo [2/2] 正在启动前端服务...
cd /d "%~dp0frontend"
start "前端服务-5173" cmd /k "npx vite --host"
echo 前端已启动 (端口5173)
echo.
echo ========================================
echo 启动完成！请等待几秒后访问:
echo.
echo   浏览器访问: http://localhost:5173
echo.
echo   测试账号:
echo     患者端  patient1 / 123456
echo     医护端  nurse1   / 123456
echo.
echo ========================================
echo.
echo 提示: 关闭此窗口不会停止服务
echo       需要停止请关闭"后端服务"和"前端服务"窗口
echo.
pause
