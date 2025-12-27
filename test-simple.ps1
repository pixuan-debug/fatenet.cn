# Simple API test script

try {
    Write-Host "Testing API health check..."
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
    Write-Host "API is running!"
} catch {
    Write-Host "API test failed with error: $($_.Exception.GetType().FullName)"
    Write-Host "Error Message: $($_.Exception.Message)"
    Write-Host "Error Details: $($_.Exception.ErrorDetails.Message)"
    Write-Host "Stack Trace: $($_.Exception.StackTrace)"
}

Write-Host "Test complete."