# 读取文件内容
$fileContent = Get-Content -Path "c:\Users\agenew\Desktop\1\index.html" -Raw

# 使用正则表达式删除内联的articles对象
$pattern = '<script>\s*// 文章数据从articles.json文件加载\s*const articles = \{[\s\S]*?\};\s*// 多语言翻译数据结构'
$replacement = '<script>\s*// 文章数据从articles.json文件加载\s*// 多语言翻译数据结构'

$newContent = $fileContent -replace $pattern, $replacement

# 保存修改后的内容
Set-Content -Path "c:\Users\agenew\Desktop\1\index.html" -Value $newContent -Encoding UTF8

Write-Host "内联articles对象已成功删除！"