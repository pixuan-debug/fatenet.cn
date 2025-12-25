$filePath = 'c:\Users\agenew\Desktop\1\index.html'
$content = Get-Content -Path $filePath -Raw

# 使用正则表达式删除内联的articles对象
$pattern = '\s*const articles = \{[\s\S]*?\};\s*'
$newContent = $content -replace $pattern, ''

# 保存修改后的内容
Set-Content -Path $filePath -Value $newContent -Encoding UTF8
Write-Host "Successfully removed inline articles object from index.html"