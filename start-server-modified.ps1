# 启动静态文件服务器脚本
# 修改版：使用不同的端口，避免冲突

param (
    [string]$Port = "8082",
    [string]$Root = "."
)

# 确保Root路径是绝对路径
if (-not [System.IO.Path]::IsPathRooted($Root)) {
    $Root = (Join-Path (Get-Location) $Root)
}

# 创建HTTP监听器
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host "Server started on http://localhost:$Port"
Write-Host "Root directory: $Root"
Write-Host "Press Ctrl+C to stop the server"

# 处理请求的函数
function Handle-Request($context) {
    try {
        $request = $context.Request
        $response = $context.Response
        $url = $request.Url.LocalPath
        
        # 处理根路径
        if ($url -eq "/") {
            $url = "/index.html"
        }
        
        # 构建文件路径
        $filePath = Join-Path $Root $url.TrimStart("/")
        
        # 检查文件是否存在
        if (Test-Path $filePath -PathType Leaf) {
            # 获取文件扩展名
            $ext = [System.IO.Path]::GetExtension($filePath)
            
            # 设置Content-Type
            switch ($ext) {
                ".html" { $contentType = "text/html" }
                ".css" { $contentType = "text/css" }
                ".js" { $contentType = "application/javascript" }
                ".json" { $contentType = "application/json" }
                ".png" { $contentType = "image/png" }
                ".jpg" { $contentType = "image/jpeg" }
                ".jpeg" { $contentType = "image/jpeg" }
                ".gif" { $contentType = "image/gif" }
                ".svg" { $contentType = "image/svg+xml" }
                ".ico" { $contentType = "image/x-icon" }
                default { $contentType = "application/octet-stream" }
            }
            
            # 读取文件内容
            $content = [System.IO.File]::ReadAllBytes($filePath)
            
            # 设置响应头
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            
            # 写入响应
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            # 文件不存在，返回404
            $response.StatusCode = 404
            $response.ContentType = "text/html"
            $content = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1><p>The requested file could not be found.</p>")
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        }
    } catch {
        # 处理异常
        $response.StatusCode = 500
        $response.ContentType = "text/plain"
        $content = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error: $($_.Exception.Message)")
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } finally {
        # 关闭响应
        $response.Close()
    }
}

# 主循环
try {
    while ($listener.IsListening) {
        # 异步等待请求
        $context = $listener.GetContext()
        
        # 使用PowerShell作业处理请求，避免阻塞
        Start-Job -ScriptBlock ${function:Handle-Request} -ArgumentList $context
    }
} catch {
    # 忽略Ctrl+C导致的异常
    if ($_.Exception.GetType().Name -ne "ThreadInterruptedException") {
        Write-Error $_.Exception.Message
    }
} finally {
    # 停止监听器
    $listener.Stop()
    $listener.Close()
    Write-Host "Server stopped"
}