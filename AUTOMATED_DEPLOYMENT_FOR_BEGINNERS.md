# 自动化部署完全指南 - 小白版

## 前提条件

在开始之前，请确保：
1. 你已经安装了Git（如果没有，我可以帮你安装）
2. 你有一个GitHub账号
3. 你已经在GitHub上创建了一个仓库

## 步骤1：检查Git安装

首先，让我们检查Git是否已经正确安装：

1. 按下 `Win + R` 键打开「运行」窗口
2. 输入 `cmd` 并按回车，打开命令提示符
3. 在命令提示符中输入：
   ```
   C:\Git\bin\git.exe --version
   ```
4. 如果你看到类似 `git version 2.50.1.windows.1` 的输出，说明Git已经正确安装

## 步骤2：配置GitHub远程仓库

现在，我们需要将本地项目连接到GitHub仓库：

1. 打开命令提示符，输入以下命令，将 `<your-repo-url>` 替换为你在GitHub上创建的仓库URL：
   ```
   C:\Git\bin\git.exe remote add origin <your-repo-url>
   ```

   例如：
   ```
   C:\Git\bin\git.exe remote add origin https://github.com/your-username/your-repo.git
   ```

2. 验证远程仓库配置是否正确：
   ```
   C:\Git\bin\git.exe remote -v
   ```

   你应该看到类似以下输出：
   ```
   origin  https://github.com/your-username/your-repo.git (fetch)
   origin  https://github.com/your-username/your-repo.git (push)
   ```

## 步骤3：配置Git自动认证

为了避免每次部署都输入GitHub用户名和密码，我们需要配置Git认证：

### 方法1：使用Git Credential Manager（推荐）

1. 第一次运行部署脚本时，Git会自动弹出登录窗口
2. 输入你的GitHub用户名和密码
3. 勾选「记住我」选项
4. 点击「登录」

Git会自动保存你的凭据，以后部署就不需要再输入了。

### 方法2：使用SSH密钥（高级用户）

如果你想使用SSH密钥，可以参考GitHub官方文档：[生成SSH密钥](https://docs.github.com/zh-cn/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

## 步骤4：运行自动化部署脚本

现在，你可以开始使用自动化部署脚本了：

1. 打开命令提示符
2. 切换到项目目录：
   ```
   cd C:\Users\agenew\Desktop\1
   ```
3. 运行自动化部署脚本：
   ```
   powershell -ExecutionPolicy Bypass -File deploy_auto.ps1
   ```

4. 脚本会自动执行以下步骤：
   - 检查Git安装情况
   - 初始化Git仓库（如果需要）
   - 自动添加所有文件
   - 自动提交（带时间戳）
   - 自动推送到GitHub
   - 显示部署结果

5. 如果看到「✅ Deployment successful!」，说明部署成功！

## 步骤5：在GitHub上启用GitHub Pages

1. 登录GitHub，进入你的仓库
2. 点击「Settings」（设置）
3. 在左侧菜单中点击「Pages」
4. 在「Source」（源）下拉菜单中选择「master」分支
5. 点击「Save」（保存）
6. 等待几分钟，GitHub会生成一个访问URL
7. 你可以通过这个URL访问你的网站

## 常见问题及解决方法

### 问题1：部署脚本无法运行

**解决方法：**
- 确保你已经切换到项目目录
- 确保脚本文件 `deploy_auto.ps1` 存在于项目目录中
- 确保你使用了正确的命令

### 问题2：推送失败，提示需要用户名和密码

**解决方法：**
- 确保你已经配置了Git Credential Manager
- 确保你输入了正确的GitHub用户名和密码
- 确保你勾选了「记住我」选项

### 问题3：推送失败，提示「src refspec master does not match any」

**解决方法：**
- 确保你已经提交了代码
- 确保本地分支名称是「master」

### 问题4：GitHub Pages无法访问

**解决方法：**
- 确保你已经正确配置了GitHub Pages
- 确保你选择了正确的分支
- 等待几分钟，GitHub需要时间生成网站
- 检查仓库中是否有 `index.html` 文件

## 一键部署快捷方式

为了更方便地使用自动化部署，你可以创建一个快捷方式：

1. 右键点击桌面，选择「新建」→「快捷方式」
2. 在「位置」中输入：
   ```
   powershell -ExecutionPolicy Bypass -File C:\Users\agenew\Desktop\1\deploy_auto.ps1
   ```
3. 点击「下一步」
4. 输入快捷方式名称，例如「一键部署」
5. 点击「完成」

现在，你只需要双击这个快捷方式，就可以自动运行部署脚本了！

## 视频教程

如果你还是不太明白，可以观看以下视频教程：

- [GitHub Pages 官方教程](https://docs.github.com/zh-cn/pages/getting-started-with-github-pages)
- [Git 入门教程](https://www.bilibili.com/video/BV1FE411P7B3/)

## 联系帮助

如果你遇到任何问题，可以：
1. 查看项目中的 `README.md` 文件
2. 查看项目中的 `DEPLOYMENT_GUIDE.md` 文件
3. 搜索GitHub官方文档
4. 寻求技术支持

祝你使用愉快！

---

**自动化部署脚本**

- 脚本名称：`deploy_auto.ps1`
- 功能：自动初始化Git仓库、添加文件、提交、推送到GitHub
- 提交信息：`[Auto Deploy] YYYY-MM-DD HH:mm:ss`
- 推送分支：master
- 运行命令：`powershell -ExecutionPolicy Bypass -File deploy_auto.ps1`