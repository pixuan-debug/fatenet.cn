# Test API service PowerShell script

Write-Host "=== API Service Test ==="
Write-Host "Test Time: $(Get-Date)"
Write-Host ""

# Test health check
Write-Host "1. Testing health check endpoint: GET /api/v1/health"
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -Method GET -UseBasicParsing
    Write-Host "   Status Code: $($healthResponse.StatusCode)"
    Write-Host "   Response: $($healthResponse.Content)"
    Write-Host "   ✓ Health check passed"
    Write-Host ""
} catch {
    Write-Host "   ✗ Health check failed: $($_.Exception.Message)"
    Write-Host ""
    exit 1
}

# Test get articles
Write-Host "2. Testing get articles endpoint: GET /api/v1/articles?useCache=false"
try {
    $articlesResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/articles?useCache=false" -Method GET -UseBasicParsing
    Write-Host "   Status Code: $($articlesResponse.StatusCode)"
    
    # Parse response content
    $articlesData = ConvertFrom-Json $articlesResponse.Content
    $categoryCount = ($articlesData.data.articles | Get-Member -MemberType NoteProperty).Count
    Write-Host "   Response: Successfully retrieved $categoryCount categories"
    Write-Host "   ✓ Get articles passed"
    Write-Host ""
} catch {
    Write-Host "   ✗ Get articles failed: $($_.Exception.Message)"
    Write-Host ""
    exit 1
}

Write-Host "=== API Service Test Complete ==="
Write-Host "All tests passed!"