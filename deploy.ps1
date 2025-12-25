# Simple deploy script using saved deployment configuration

Write-Output "Simple Deploy Script"
Write-Output "=================="
Write-Output "Using saved successful deployment configuration"
Write-Output ""

# Step 1: Check git status
Write-Output "1. Checking git status..."
git status
Write-Output ""

# Step 2: Check for uncommitted changes
$changes = git status --porcelain
if ($changes) {
    Write-Output "2. Found uncommitted changes, committing..."
    git add .
    git commit -m "Auto deploy: $(Get-Date)"
    Write-Output ""
}

# Step 3: Push to GitHub
Write-Output "3. Pushing to GitHub..."
git push origin main

# Step 4: Check result
if ($LASTEXITCODE -eq 0) {
    Write-Output ""
    Write-Output "Deploy successful!"
    Write-Output "- Code pushed to GitHub"
    Write-Output "- GitHub Actions auto-deploying to Pages"
    Write-Output "- Website will update automatically"
    Write-Output ""
    Write-Output "Next deploy: Run this script again"
} else {
    Write-Output ""
    Write-Output "Deploy failed!"
    Write-Output "Please check error messages above"
    exit 1
}