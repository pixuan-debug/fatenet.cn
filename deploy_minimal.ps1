# Minimal deploy script
Write-Output "Minimal Deploy Script"
Write-Output "================="

# Basic git commands
git status
Write-Output "\nChecking for changes..."

$changes = git status --porcelain
if ($changes) {
    Write-Output "Found changes, committing..."
    git add .
    git commit -m "Auto deploy"
    Write-Output "Changes committed."
}

Write-Output "\nPushing to GitHub..."
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Output "\n✅ Deployment successful!"
    Write-Output "Your website will update in 1-5 minutes."
} else {
    Write-Output "\n❌ Deployment failed!"
    Write-Output "Check error messages above."
}

Write-Output "\nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")