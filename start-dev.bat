@echo off
echo 启动开发环境...

:: 启动后端服务
start cmd /k "cd lottery-backend && npm run dev"

:: 等待2秒后启动前端服务
timeout /t 2 /nobreak
start cmd /k "npm run dev"

echo 服务已启动！
echo 前端运行在 http://localhost:8989 (或其他可用端口)
echo 后端运行在 http://localhost:8000 