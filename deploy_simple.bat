@echo off
chcp 65001 >nul

:: 简单的一键部署脚本

cd /d %~dp0

cls
echo ================
echo Simple Deploy
============
echo. 

:: 步骤1: 检查Git状态
echo Step 1: Checking Git status...
git status
echo.
echo Press any key to continue...
pause >nul

:: 步骤2: 检查未提交更改
echo Step 2: Checking for changes...
git status --porcelain > git_changes.txt
set changes_found=no
for /f "usebackq" %%a in ("git_changes.txt") do set changes_found=yes
del git_changes.txt

echo.
echo Press any key to continue...
pause >nul

:: 步骤3: 如果有更改，提交
echo Step 3: Committing changes...
if "%changes_found%"=="yes" (
    git add .
    git commit -m "Auto deploy"
    echo Changes committed.
) else (
    echo No changes to commit.
)

echo.
echo Press any key to continue...
pause >nul

:: 步骤4: 推送到GitHub
echo Step 4: Pushing to GitHub...
git push origin main

echo.
echo Press any key to continue...
pause >nul

:: 步骤5: 显示结果
echo Step 5: Deployment result...
if %ERRORLEVEL%==0 (
    echo.
    echo ================
    echo DEPLOYMENT SUCCESS
    echo ================
    echo Your website is now being deployed.
    echo It will be updated in 1-5 minutes.
    echo.
) else (
    echo.
    echo ================
    echo DEPLOYMENT FAILED
    echo ================
    echo Please check the error messages above.
    echo.
    echo Common issues:
    echo 1. Network connection problem
    echo 2. GitHub not logged in
    echo 3. Git not installed
    echo.
)

echo Press any key to exit...
pause >nul