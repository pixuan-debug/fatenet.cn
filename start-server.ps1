# Simple HTTP Server in PowerShell

$port = 8081
$root = Resolve-Path "."

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server started on http://localhost:$port"
Write-Host "Root directory: $root"
Write-Host "Press Ctrl+C to stop the server"

# MIME types map
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js" = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".css" = "text/css; charset=utf-8"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".gif" = "image/gif"
    ".svg" = "image/svg+xml; charset=utf-8"
}

# Function to handle requests
function HandleRequest($context) {
    $request = $context.Request
    $response = $context.Response
    
    try {
        $localPath = $request.Url.LocalPath
        
        if ($localPath -eq "/") {
            $localPath = "/index.html"
        }
        
        $filePath = Join-Path $root $localPath.TrimStart("/")
        
        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            if ($mimeTypes.ContainsKey($extension)) {
                $contentType = $mimeTypes[$extension]
            } else {
                $contentType = "application/octet-stream"
            }
            
            if ($extension -match "\.(png|jpg|gif|svg)$") {
                $content = [System.IO.File]::ReadAllBytes($filePath)
            } else {
                $content = Get-Content $filePath -Raw
            }
            
            $buffer = if ($content -is [string]) {
                [System.Text.Encoding]::UTF8.GetBytes($content)
            } else {
                $content
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.StatusCode = 200
            
            Write-Host "200 $localPath"
        } else {
            $response.StatusCode = 404
            $response.ContentType = "text/plain"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "404 $localPath"
        }
    } catch {
        $response.StatusCode = 500
        $response.ContentType = "text/plain"
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error")
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        
        Write-Host "500 $($request.Url.LocalPath)"
    } finally {
        $response.OutputStream.Close()
    }
}

# Main loop
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $null = Start-Job -ScriptBlock ${function:HandleRequest} -ArgumentList $context
    }
} finally {
    $listener.Stop()
    $listener.Close()
    Write-Host "Server stopped"
}