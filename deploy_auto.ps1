# 自动化部署脚本 - 无需交互
# 用于 Trae CN 快捷键一键部署

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Zodiac Match Tool - Auto Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Git is available
try {
    $gitPath = "C:\Git\bin\git.exe"
    $gitVersion = & $gitPath --version 2>&1
    Write-Host "Git Version: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Git not installed!" -ForegroundColor Red
    Write-Host "Please install Git from https://gitforwindows.org/" -ForegroundColor Yellow
    exit 1
}

# Check Git repository
try {
    if (-not (Test-Path ".git")) {
        Write-Host "Initializing Git repository..." -ForegroundColor Yellow
        & $gitPath init 2>&1 | Write-Host
    }
    
    # Auto add and commit
    Write-Host "Adding all files..." -ForegroundColor Yellow
    & $gitPath add . 2>&1 | Write-Host
    
    Write-Host "Committing changes..." -ForegroundColor Yellow
    & $gitPath commit -m "[Auto Deploy] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" 2>&1 | Write-Host
    
    # Push to correct branch
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    & $gitPath push origin master 2>&1 | Write-Host
    
    Write-Host "" -ForegroundColor Green
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "Please login to GitHub to enable GitHub Pages" -ForegroundColor Yellow
    Write-Host "=========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}