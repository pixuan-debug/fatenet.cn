@echo off
cls

echo ================
echo 一键部署脚本
echo ================
echo 已保存成功的部署配置
echo.

echo 1. 检查Git状态...
git status
echo.

echo 2. 检查未提交更改...
git status --porcelain > status.txt
for /f "tokens=*" %%a in (status.txt) do set "has_changes=%%a"
del status.txt

if defined has_changes (
    echo 发现未提交更改，正在提交...
    git add .
    git commit -m "Auto deploy: %date% %time%"
    echo.
)

echo 3. 推送代码到GitHub...
git push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo 部署成功！
    echo - 代码已推送到GitHub
    echo - GitHub Actions正在自动部署
    echo - 网站将自动更新
    echo.
    echo 下次部署直接运行: deploy.bat
) else (
    echo.
    echo 部署失败，请检查错误信息
    pause
    exit /b 1
)

pause
