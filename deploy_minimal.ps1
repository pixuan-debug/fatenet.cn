# Minimal deploy script for GitHub Pages

Write-Host "=== Minimal Deploy Script ===" -ForegroundColor Green
Write-Host ""

# Step 1: Check git status
Write-Host "1. Checking git status..."
git status
Write-Host ""

# Step 2: Check for changes
Write-Host "2. Checking for changes..."
$changes = git status --porcelain
if ($changes) {
    Write-Host "Found changes, committing..."
    git add .
    git commit -m "Auto deploy: $(Get-Date)"
    Write-Host ""
}

# Step 3: Push to GitHub
Write-Host "3. Pushing to GitHub..."
git push origin main

# Step 4: Show result
Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy successful!" -ForegroundColor Green
    Write-Host "- Code pushed to GitHub"
    Write-Host "- GitHub Actions deploying to Pages"
    Write-Host "- Website will update in 1-5 minutes"
} else {
    Write-Host "❌ Deploy failed!" -ForegroundColor Red
    Write-Host "Please check error messages above"
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")