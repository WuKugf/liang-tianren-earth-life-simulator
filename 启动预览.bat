@echo off
cd /d %~dp0
echo 正在启动本地预览服务器...
where node >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080
  node server.cjs 8080
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080
  python -m http.server 8080
  goto :eof
)
echo 未找到 node 或 python，请先安装其中之一。
pause
