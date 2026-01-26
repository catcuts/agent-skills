# 常见问题排查

本文档汇总了 Claude Code 技能开发和发布过程中的常见问题及其解决方案。

---

## 🔍 问题分类

- [安装问题](#1-安装问题)
- [路径问题](#2-路径问题)
- [版本兼容性](#3-版本兼容性)
- [平台差异](#4-平台差异)
- [npm 发布问题](#5-npm-发布问题)
- [技能调用问题](#6-技能调用问题)

---

## 1️⃣ 安装问题

### 1.1 add-skill 安装失败

**错误信息**:
```
Error: Cannot find module 'add-skill'
```

**原因**: add-skill 未正确安装

**解决方案**:

```bash
# 方法一：手动安装 add-skill
npm install -g add-skill

# 方法二：使用 npx（推荐）
npx add-skill@latest . -a claude-code -y

# 方法三：在 package.json 中指定版本
"optionalDependencies": {
  "add-skill": "^1.0.29"
}
```

### 1.2 安装脚本执行失败

**错误信息**:
```
postinstall: `node scripts/install-skill.js`
Exit status 1
```

**原因**: 安装脚本有语法错误或权限问题

**解决方案**:

```bash
# 1. 检查脚本语法
node -c scripts/install-skill.js

# 2. 查看详细错误信息
node scripts/install-skill.js

# 3. 检查文件权限（Linux/macOS）
chmod +x scripts/install-skill.js

# 4. Windows 检查路径分隔符
# 确保使用 path.join() 而不是硬编码路径
```

### 1.3 SKILL.md 未正确安装

**错误信息**:
```
Error: SKILL.md not found
```

**原因**: files 字段配置错误或 SKILL.md 不在项目根目录

**解决方案**:

```json
// 检查 package.json 的 files 字段
{
  "files": [
    "SKILL.md",      // 确保包含 SKILL.md
    "scripts/"       // 确保包含 scripts/ 目录
  ]
}

// 检查 SKILL.md 是否存在
ls SKILL.md

// 检查 SKILL.md 是否在项目根目录
pwd  # 确保在项目根目录
ls -la
```

### 1.4 全局安装 vs 项目级安装混乱

**症状**: 技能安装在错误的位置

**原因**: 安装范围参数不正确

**解决方案**:

```bash
# 明确指定安装范围
npm run install:local    # 项目级安装
npm run install:global   # 全局安装

# 检查安装位置
# 项目级
ls .claude/skills/my-skill/SKILL.md
ls .agents/skills/my-skill/SKILL.md

# 全局
ls ~/.claude/skills/my-skill/SKILL.md
ls ~/.agents/skills/my-skill/SKILL.md
```

---

## 2️⃣ 路径问题

### 2.1 Windows 路径问题

**错误信息**:
```
Error: ENOENT: no such file or directory, open 'E:\path\to\file'
```

**原因**: Windows 路径分隔符或空格问题

**解决方案**:

```javascript
// ✅ 好的做法：使用 path.join()
const path = require('path');
const filePath = path.join(__dirname, '..', 'SKILL.md');

// ❌ 不好的做法：硬编码路径
const filePath = 'E:\\path\\to\\SKILL.md';

// ✅ 好的做法：使用 path.resolve()
const packageRoot = path.resolve(__dirname, '..');

// 处理带空格的路径
const command = `"${packageRoot}"`;  // 用引号包裹
```

### 2.2 相对路径问题

**症状**: 找不到文件或目录

**原因**: 相对路径基于当前工作目录，而非脚本所在目录

**解决方案**:

```javascript
// ❌ 不好的做法：使用相对路径
const filePath = '../SKILL.md';

// ✅ 好的做法：使用 __dirname
const path = require('path');
const filePath = path.join(__dirname, '..', 'SKILL.md');

// ✅ 好的做法：使用 path.resolve()
const filePath = path.resolve(__dirname, '..', 'SKILL.md');
```

### 2.3 符号链接问题

**症状**: 找不到已安装的技能

**原因**: 符号链接未正确创建

**解决方案**:

```bash
# 检查符号链接
# Linux/macOS
ls -la ~/.claude/skills/my-skill

# Windows
dir %USERPROFILE%\.claude\skills\my-skill

# 如果符号链接损坏，删除并重新安装
rm -rf ~/.claude/skills/my-skill
npm run install:global
```

---

## 3️⃣ 版本兼容性

### 3.1 Node.js 版本不兼容

**错误信息**:
```
Error: Node.js version too old. Requires >=18.0.0
```

**原因**: Node.js 版本过低

**解决方案**:

```bash
# 检查 Node.js 版本
node --version

# 升级 Node.js
# 方法一：使用 nvm（推荐）
nvm install 20
nvm use 20

# 方法二：从官网下载安装
# https://nodejs.org/

# 在 package.json 中指定版本
"engines": {
  "node": ">=18.0.0"
}
```

### 3.2 npm 版本不兼容

**错误信息**:
```
npm ERR! notsup Not compatible with your version of npm
```

**原因**: npm 版本过低

**解决方案**:

```bash
# 检查 npm 版本
npm --version

# 升级 npm
npm install -g npm@latest

# 或使用特定版本
npm install -g npm@9.0.0
```

### 3.3 add-skill 版本问题

**错误信息**:
```
Error: add-skill version incompatible
```

**原因**: add-skill 版本过低或过高

**解决方案**:

```json
// 在 package.json 中固定版本
{
  "optionalDependencies": {
    "add-skill": "^1.0.29"  // 使用 ^ 允许小版本更新
    // 或
    "add-skill": "1.0.29"   // 固定版本
  }
}
```

---

## 4️⃣ 平台差异

### 4.1 Windows vs Unix 路径

**问题**: 不同操作系统路径分隔符不同

**解决方案**:

```javascript
// ✅ 跨平台方案：使用 path.join()
const path = require('path');
const filePath = path.join('users', 'documents', 'file.txt');

// ❌ 不好的做法：硬编码路径分隔符
const filePath = 'users/documents/file.txt';      // Linux/macOS
const filePath = 'users\\documents\\file.txt';    // Windows
```

### 4.2 命令差异

**问题**: 不同操作系统命令不同

**解决方案**:

```javascript
// ✅ 跨平台方案：使用 cross-env
// 安装：npm install cross-env --save-dev

// package.json
{
  "scripts": {
    "test": "cross-env NODE_ENV=test node test.js"
  }
}

// 或在代码中判断
const rmCmd = process.platform === 'win32' ? 'del' : 'rm';
const args = process.platform === 'win32' ? [] : ['-rf'];
```

### 4.3 权限问题

**问题**: Unix 系统需要执行权限

**解决方案**:

```bash
# 添加执行权限（Linux/macOS）
chmod +x scripts/install-skill.js
chmod +x scripts/uninstall-skill.js

# 或在 package.json 中使用 node 执行
{
  "scripts": {
    "postinstall": "node scripts/install-skill.js"
  }
}
```

---

## 5️⃣ npm 发布问题

### 5.1 包名已被占用

**错误信息**:
```
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/@catcheers/my-skill
```

**原因**: 包名已被其他人使用

**解决方案**:

```bash
# 检查包名是否可用
npm view @catcheers/my-skill

# 如果包名已存在，更换包名
# 修改 package.json 中的 name 字段
{
  "name": "@catcheers/my-skill-v2"  // 添加后缀
}

# 或使用你的 npm 用户名
{
  "name": "@your-username/my-skill"
}
```

### 5.2 版本号未更新

**错误信息**:
```
npm ERR! 403 Forbidden - you cannot publish over the existing version
```

**原因**: 版本号已存在，需要更新

**解决方案**:

```bash
# 自动更新版本号
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# 或手动更新版本号
# 编辑 package.json
{
  "version": "1.0.1"
}
```

### 5.3 发布失败 "402 Payment Required"

**错误信息**:
```
npm ERR! 402 Payment Required
```

**原因**: scoped 包默认为私有包，需要付费

**解决方案**:

```bash
# 发布为公开包
npm publish --access public

# 或在 package.json 中配置
{
  "publishConfig": {
    "access": "public"
  }
}
```

### 5.4 npm token 失效

**错误信息**:
```
npm ERR! 401 Unauthorized - Bad authorization
```

**原因**: npm token 失效或未配置

**解决方案**:

```bash
# 重新登录
npm login

# 或创建新的 token
# 在 npm 网站上创建 token：https://www.npmjs.com/settings/tokens

# 使用 token 登录
npm login --registry=https://registry.npmjs.org/
# Username: your-username
# Password: your-token
```

---

## 6️⃣ 技能调用问题

### 6.1 技能未被识别

**症状**: `/skills` 列表中没有显示技能

**原因**: SKILL.md 未正确安装或格式错误

**解决方案**:

```bash
# 1. 检查 SKILL.md 是否存在
ls ~/.claude/skills/my-skill/SKILL.md

# 2. 检查 SKILL.md 格式
head -n 10 ~/.claude/skills/my-skill/SKILL.md

# 3. 验证 YAML frontmatter
# 确保以 --- 开头和结尾
---
name: my-skill
description: 技能描述
allowed-tools: Bash
---

# 4. 重新安装
npm run uninstall:global
npm run install:global
```

### 6.2 任务指令未执行

**症状**: 调用技能后无响应或输出不符合预期

**原因**: 任务指令编写不清晰或工具未声明

**解决方案**:

```markdown
## 检查清单

1. **YAML frontmatter**
   - [ ] allowed-tools 包含所有需要的工具
   - [ ] name 字段与技能名称一致

2. **任务指令**
   - [ ] 步骤清晰，编号列表
   - [ ] 明确指定使用的工具
   - [ ] 包含友好的提示信息

3. **测试验证**
   - [ ] 在 Claude Code 中测试技能
   - [ ] 观察输出是否符合预期
   - [ ] 检查是否有错误信息
```

### 6.3 工具调用失败

**错误信息**:
```
Error: Tool 'Bash' not allowed
```

**原因**: YAML frontmatter 中未声明该工具

**解决方案**:

```yaml
---
# 确保在 allowed-tools 中声明所有使用的工具
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---
```

---

## 7️⃣ 调试技巧

### 7.1 启用详细日志

```bash
# npm 安装时显示详细日志
npm install -g @catcheers/my-skill --verbose

# 查看 add-skill 执行过程
npx add-skill . -a claude-code -g -y --verbose
```

### 7.2 本地测试

```bash
# 测试安装脚本
node scripts/install-skill.js --dry-run

# 手动执行 add-skill 命令
npx add-skill . -a claude-code -y

# 检查安装结果
ls .claude/skills/my-skill/SKILL.md
```

### 7.3 查看日志

```bash
# 查看 npm 日志
npm log

# 查看 add-skill 日志
# 日志位置：~/.npm/_logs/
ls ~/.npm/_logs/
```

### 7.4 清理缓存

```bash
# 清理 npm 缓存
npm cache clean --force

# 清理安装文件
rm -rf node_modules/
rm -rf package-lock.json

# 清理技能安装
rm -rf .claude/
rm -rf .agents/
rm -rf ~/.claude/skills/my-skill/
rm -rf ~/.agents/skills/my-skill/

# 重新安装
npm install
npm run install:local
```

---

## 8️⃣ 获取帮助

### 8.1 查看文档

- [项目结构规范](./01-project-structure.md)
- [开发流程规范](./02-development-workflow.md)
- [测试流程规范](./03-testing-guide.md)
- [发布流程规范](./04-publishing-workflow.md)
- [技能编写参考](./05-skills-reference.md)

### 8.2 搜索已知问题

```bash
# 在 GitHub 上搜索问题
https://github.com/catcuts/agent-skills/issues

# 在 npm 上搜索类似包
https://www.npmjs.com/search?q=claude-code+skill
```

### 8.3 提交问题

如果以上方法都无法解决问题，请提交 Issue：

1. **描述问题**: 清晰说明问题现象
2. **提供环境信息**: Node.js 版本、npm 版本、操作系统
3. **提供错误信息**: 完整的错误日志
4. **提供复现步骤**: 如何重现问题

### 8.4 社区支持

- [GitHub Discussions](https://github.com/catcuts/agent-skills/discussions)
- [Claude Code 官方文档](https://claude.com/claude-code)

---

## 📋 快速检查清单

### 安装失败

- [ ] Node.js 版本 >= 18.0.0
- [ ] npm 版本 >= 9.0.0
- [ ] 网络连接正常
- [ ] package.json 格式正确
- [ ] SKILL.md 格式正确
- [ ] 安装脚本可执行

### 调用失败

- [ ] SKILL.md 已正确安装
- [ ] YAML frontmatter 格式正确
- [ ] allowed-tools 包含所有需要的工具
- [ ] 任务指令清晰易懂
- [ ] Claude Code 已重启

### 发布失败

- [ ] npm 账户已登录
- [ ] 包名可用
- [ ] 版本号已更新
- [ ] package.json 配置正确
- [ ] npm token 有效

---

## 🔗 相关资源

- [开发模板](../../ref/agent-skill-npm-boilerplate@catcuts/) - 完整的项目模板
- [示例项目](../skill-development-standard/examples/) - 简单和复杂示例
- [GitHub Issues](https://github.com/catcuts/agent-skills/issues) - 问题追踪

---

**需要帮助?** 提交 [Issue](https://github.com/catcuts/agent-skills/issues)
