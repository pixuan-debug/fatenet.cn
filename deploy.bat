@echo off
setlocal enabledelayedexpansion

rem 确保脚本在正确的目录中运行
if not exist "%~dp0articles.json" (
    echo 错误：请在项目文件夹中运行此脚本！
    echo 当前目录：%cd%
    echo 正确目录：%~dp0
    pause
    exit /b 1
)

cd /d "%~dp0"

cls
echo ================
echo 一键部署脚本
echo ================
echo 已保存成功的部署配置
echo.
echo 按任意键开始部署...
pause >nul

echo.
echo 1. 检查Git状态...
git status
echo.
echo 按任意键继续...
pause >nul

echo 2. 检查未提交更改...
git status --porcelain > status.txt
set "has_changes="
for /f "tokens=*" %%a in (status.txt) do set "has_changes=%%a"
del status.txt

echo.
echo 按任意键继续...
pause >nul

if defined has_changes (
    echo.
    echo 3. 发现未提交更改，正在提交...
    git add .
    for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
    set datetime=!datetime:~0,4!-!datetime:~4,2!-!datetime:~6,2! !datetime:~8,2!:!datetime:~10,2!:!datetime:~12,2!
    git commit -m "Auto deploy: !datetime!"
    echo.
    echo 按任意键继续...
    pause >nul
)

echo.
echo 4. 推送代码到GitHub...
git push origin main

echo.
echo 按任意键继续...
pause >nul

if %ERRORLEVEL% equ 0 (
    echo.
    echo ================
    echo ✅ 部署成功！
    echo ================
    echo - 代码已成功推送到GitHub
    echo - GitHub Actions正在自动部署到Pages
    echo - 网站将在1-5分钟后自动更新
    echo.
    echo 📌 下次部署直接运行此脚本
    echo.
    echo 按任意键关闭...
    pause >nul
) else (
    echo.
    echo ================
    echo ❌ 部署失败！
    echo ================
    echo 请检查上面的错误信息
    echo.
    echo 常见问题：
    echo 1. 网络连接问题
    echo 2. GitHub账号未登录
    echo 3. Git未安装
    echo.
    echo 按任意键关闭...
    pause >nul
    exit /b 1
)