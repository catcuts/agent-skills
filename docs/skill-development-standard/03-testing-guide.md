# 测试流程规范

本文档定义了 Claude Code 技能的完整测试流程，确保技能在不同环境下都能正常工作。

---

## 🧪 测试流程概览

```
1. 本地测试
   ↓
2. 安装测试
   ↓
3. 功能验证
   ↓
4. CI/CD 集成测试
```

---

## 1️⃣ 本地测试

### 1.1 测试安装脚本

#### 测试模式（dry-run）

```bash
# 方式一：使用 npm test
npm test

# 方式二：直接运行脚本
node scripts/install-skill.js --dry-run
```

**预期输出**：

```
✓ 开始安装 My Skill...
✓ 安装范围: 全局(GLOBAL)

[DRY-RUN] 将要执行的命令:
  npx add-skill "/path/to/my-skill" -g -y

✓ 测试通过 - 实际安装请运行: npm run install:global 或 npm run install:local
```

#### 验证要点

- [ ] 命令行参数正确解析
- [ ] 安装路径正确显示
- [ ] add-skill 命令格式正确
- [ ] 无错误信息

### 1.2 验证必需文件

```bash
# 检查必需文件是否存在
ls -la package.json
ls -la SKILL.md
ls -la scripts/install-skill.js
ls -la scripts/uninstall-skill.js
```

#### 验证要点

- [ ] package.json 包含所有必需字段
- [ ] SKILL.md 格式正确（YAML frontmatter）
- [ ] 安装脚本可执行
- [ ] 卸载脚本可执行

### 1.3 验证 package.json

```bash
# 验证 JSON 格式
cat package.json | jq empty

# 检查必需字段
cat package.json | jq '.name'
cat package.json | jq '.version'
cat package.json | jq '.description'
cat package.json | jq '.files'
```

#### 验证要点

- [ ] JSON 格式正确（可解析）
- [ ] name 字段符合 npm scope 格式
- [ ] version 遵循语义化版本规范
- [ ] files 字段包含 SKILL.md 和 scripts/

---

## 2️⃣ 安装测试

### 2.1 项目级安装测试

```bash
# 清理旧安装
rm -rf .claude .agents

# 安装到当前项目
npm run install:local

# 验证安装路径
ls -la .claude/skills/my-skill/SKILL.md
ls -la .agents/skills/my-skill/SKILL.md
```

#### 验证要点

- [ ] `.agents/skills/my-skill/` 目录已创建
- [ ] `.claude/skills/my-skill/` 符号链接已创建
- [ ] SKILL.md 文件已正确复制
- [ ] 安装脚本输出成功信息

### 2.2 全局安装测试

```bash
# 清理旧安装
rm -rf ~/.claude/skills/my-skill
rm -rf ~/.agents/skills/my-skill

# 全局安装
npm run install:global

# 验证安装路径
ls -la ~/.claude/skills/my-skill/SKILL.md
ls -la ~/.agents/skills/my-skill/SKILL.md
```

#### 验证要点

- [ ] `~/.agents/skills/my-skill/` 目录已创建
- [ ] `~/.claude/skills/my-skill/` 符号链接已创建
- [ ] SKILL.md 文件已正确复制
- [ ] 安装脚本输出成功信息

### 2.3 卸载测试

```bash
# 项目级卸载
npm run uninstall:local

# 验证清理
ls .claude/skills/my-skill 2>&1 | grep "No such file"

# 全局卸载
npm run uninstall:global

# 验证清理
ls ~/.claude/skills/my-skill 2>&1 | grep "No such file"
```

#### 验证要点

- [ ] `.agents/` 目录已删除
- [ ] `.claude/` 符号链接已删除
- [ ] 卸载脚本输出成功信息

---

## 3️⃣ 功能验证

### 3.1 在 Claude Code 中测试

#### 启动 Claude Code

```bash
claude
```

#### 列出已安装技能

```
/skills
```

**预期输出**：

```
Available skills:
- my-skill
- other-skills...
```

#### 调用技能

```
my-skill
```

#### 验证要点

- [ ] 技能出现在 /skills 列表中
- [ ] 技能名称正确显示
- [ ] 调用技能后执行任务指令
- [ ] 输出符合预期格式
- [ ] 错误处理正常工作

### 3.2 功能测试清单

#### 基本功能

- [ ] 技能能正确识别调用
- [ ] 任务指令按预期执行
- [ ] 使用的工具（Bash, Read, Write 等）正常工作
- [ ] 输出格式清晰易读

#### 错误处理

- [ ] 文件不存在时有友好提示
- [ ] 权限不足时有错误提示
- [ ] 无效输入有错误提示

#### 边界情况

- [ ] 空输入处理
- [ ] 特殊字符处理
- [ ] 大文件处理

### 3.3 多平台测试

推荐在以下平台测试：

| 平台    | Node.js 版本 | 测试命令                            |
| ------- | ------------ | ----------------------------------- |
| Ubuntu  | 18.x, 20.x   | `npm run install:local && npm test` |
| macOS   | 18.x, 20.x   | `npm run install:local && npm test` |
| Windows | 18.x, 20.x   | `npm run install:local && npm test` |

---

## 4️⃣ CI/CD 集成测试

### 4.1 GitHub Actions 配置

创建 `.github/workflows/ci.yml`：

```yaml
name: CI

on:
    push:
        branches: [main, develop]
    pull_request:
        branches: [main, develop]

jobs:
    test:
        name: Test Installation
        runs-on: ${{ matrix.os }}

        strategy:
            matrix:
                os: [ubuntu-latest, macos-latest, windows-latest]
                node-version: [18.x, 20.x]

        steps:
            - name: Checkout code
              uses: actions/checkout@v3

            - name: Setup Node.js ${{ matrix.node-version }}
              uses: actions/setup-node@v3
              with:
                  node-version: ${{ matrix.node-version }}

            - name: Install dependencies
              run: npm ci || npm install

            - name: Run installation test
              run: npm test

            - name: Verify SKILL.md format
              run: |
                  if [ ! -f SKILL.md ]; then
                    echo "Error: SKILL.md not found"
                    exit 1
                  fi
                  # Check for required frontmatter
                  if ! grep -q "^---$" SKILL.md; then
                    echo "Error: SKILL.md missing frontmatter"
                    exit 1
                  fi
              shell: bash

            - name: Verify required files
              run: |
                  required_files=(
                    "package.json"
                    "SKILL.md"
                  )
                  for file in "${required_files[@]}"; do
                    if [ ! -f "$file" ]; then
                      echo "Error: Required file $file not found"
                      exit 1
                    fi
                  done
              shell: bash

    validate-skill:
        name: Validate Skill Structure
        runs-on: ubuntu-latest

        steps:
            - name: Checkout code
              uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: '18.x'

            - name: Validate SKILL.md structure
              run: |
                  echo "Validating SKILL.md structure..."

                  # Check for frontmatter
                  if ! head -n 1 SKILL.md | grep -q "^---$"; then
                    echo "Error: SKILL.md must start with frontmatter delimiter (---)"
                    exit 1
                  fi

                  # Extract frontmatter
                  frontmatter=$(sed -n '/^---$/,/^---$/p' SKILL.md | head -n -1 | tail -n +2)

                  # Check for required fields
                  if ! echo "$frontmatter" | grep -q "^name:"; then
                    echo "Error: SKILL.md frontmatter missing 'name' field"
                    exit 1
                  fi

                  if ! echo "$frontmatter" | grep -q "^description:"; then
                    echo "Error: SKILL.md frontmatter missing 'description' field"
                    exit 1
                  fi

                  # Extract name
                  skill_name=$(echo "$frontmatter" | grep "^name:" | cut -d' ' -f2- | tr -d ' ')

                  # Validate name format (lowercase, hyphens, max 64 chars)
                  if ! echo "$skill_name" | grep -Eq "^[a-z0-9-]{1,64}$"; then
                    echo "Error: Skill name must be lowercase letters, numbers, and hyphens only (max 64 chars)"
                    exit 1
                  fi

                  echo "✅ SKILL.md structure is valid"
              shell: bash
```

### 4.2 CI 检查清单

#### 基础检查

- [ ] 多平台测试通过（Ubuntu, macOS, Windows）
- [ ] 多版本 Node.js 测试通过（18.x, 20.x）
- [ ] 安装脚本测试通过
- [ ] SKILL.md 格式验证通过

#### 文件验证

- [ ] package.json 存在且格式正确
- [ ] SKILL.md 存在且格式正确
- [ ] scripts/ 目录存在
- [ ] 安装/卸载脚本存在

#### 结构验证

- [ ] SKILL.md 以 `---` 开头
- [ ] frontmatter 包含 `name` 字段
- [ ] frontmatter 包含 `description` 字段
- [ ] skill_name 格式正确（小写、连字符、不超过 64 字符）

### 4.3 本地 CI 测试

在推送前本地测试 CI 脚本：

```bash
# 安装 act（GitHub Actions 本地运行工具）
brew install act  # macOS
choco install act  # Windows

# 运行 CI 测试
act push
```

---

## 5️⃣ 测试报告模板

### 测试报告

```markdown
## 技能测试报告

**技能名称**: my-skill
**版本**: 1.0.0
**测试日期**: 2026-01-26
**测试人员**: your-name

### 本地测试

- [x] 安装脚本测试通过
- [x] 必需文件验证通过
- [x] package.json 验证通过

### 安装测试

- [x] 项目级安装测试通过
- [x] 全局安装测试通过
- [x] 卸载测试通过

### 功能验证

- [x] 技能列表显示正确
- [x] 技能调用正常
- [x] 输出格式符合预期
- [x] 错误处理正常

### CI/CD 测试

- [x] Ubuntu 18.x 测试通过
- [x] Ubuntu 20.x 测试通过
- [x] macOS 18.x 测试通过
- [x] macOS 20.x 测试通过
- [x] Windows 18.x 测试通过
- [x] Windows 20.x 测试通过

### 问题记录

无

### 测试结论

✅ 测试通过，可以发布
```

---

## 6️⃣ 常见测试问题

### Q1: 安装脚本报错 "add-skill not found"

**原因**: add-skill 未安装或网络问题

**解决方案**:

```bash
# 手动安装 add-skill
npm install -g add-skill

# 或使用 npx
npx add-skill@latest . -a claude-code -y
```

### Q2: SKILL.md 验证失败

**原因**: YAML frontmatter 格式错误

**解决方案**:

```bash
# 检查 frontmatter 格式
head -n 10 SKILL.md

# 确保以 --- 开头和结尾
---
name: my-skill
description: 技能描述
allowed-tools: Bash
---
```

### Q3: Windows 测试失败

**原因**: 路径分隔符或命令差异

**解决方案**:

```javascript
// 在脚本中使用 path.join() 处理路径
const skillDir = path.join(os.homedir(), '.claude', 'skills', name);

// 使用 cross-platform 命令
const rmCmd = process.platform === 'win32' ? 'del' : 'rm';
```

### Q4: CI 测试通过但本地安装失败

**原因**: 环境差异（Node.js 版本、权限等）

**解决方案**:

```bash
# 检查本地 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 清理缓存重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 7️⃣ 测试最佳实践

### 1. 早期测试

- 开发过程中频繁测试
- 每次修改后立即测试
- 不要等到最后才测试

### 2. 自动化测试

- 使用 GitHub Actions 自动测试
- 每次推送自动运行测试
- PR 必须通过测试才能合并

### 3. 多环境测试

- 至少在 Ubuntu 和 macOS 上测试
- 如果可能，在 Windows 上测试
- 测试多个 Node.js 版本

### 4. 测试文档

- 记录测试步骤和结果
- 记录遇到的问题和解决方案
- 更新测试清单

### 5. 持续改进

- 根据测试结果改进代码
- 修复发现的问题
- 优化测试流程

---

## 8️⃣ 测试检查清单

### 本地测试

- [ ] 运行 `npm test` 测试安装脚本
- [ ] 验证 package.json 格式正确
- [ ] 验证 SKILL.md 格式正确
- [ ] 验证必需文件存在

### 安装测试

- [ ] 项目级安装成功
- [ ] 全局安装成功
- [ ] 卸载功能正常
- [ ] 安装路径正确

### 功能测试

- [ ] 技能列表显示正确
- [ ] 技能调用正常
- [ ] 任务指令执行正确
- [ ] 输出格式符合预期
- [ ] 错误处理正常

### CI/CD 测试

- [ ] GitHub Actions 配置正确
- [ ] 多平台测试通过
- [ ] 多版本测试通过
- [ ] SKILL.md 验证通过
- [ ] 必需文件验证通过

---

## 📚 相关文档

- [02-development-workflow.md](./02-development-workflow.md) - 开发流程规范
- [04-publishing-workflow.md](./04-publishing-workflow.md) - 发布流程规范
- [06-troubleshooting.md](./06-trroubleshooting.md) - 常见问题排查

---

## 🎯 下一步

测试通过后：

1. **准备发布**: 阅读 [04-publishing-workflow.md](./04-publishing-workflow.md)
2. **版本管理**: 更新版本号和 CHANGELOG
3. **发布到 npm**: 执行发布命令

---

**开始测试**: 运行 `npm test` 开始测试你的技能
