# 发布流程规范

本文档定义了 Claude Code 技能的完整发布流程，确保技能能够顺利发布到 npm 并被用户安装使用。

---

## 🚀 发布流程概览

```
1. 发布前检查
   ↓
2. 版本管理
   ↓
3. 构建和打包
   ↓
4. 发布到 npm
   ↓
5. 发布后验证
```

---

## 1️⃣ 发布前检查

### 1.1 完整性检查清单

#### 文件检查

- [ ] `package.json` - 包配置完整且格式正确
- [ ] `SKILL.md` - 技能定义文件格式正确
- [ ] `scripts/install-skill.js` - 安装脚本可执行
- [ ] `scripts/uninstall-skill.js` - 卸载脚本可执行
- [ ] `README.md` - 使用文档完整
- [ ] `LICENSE` - 许可证文件（推荐 MIT）

#### 配置检查

- [ ] `name` 使用 npm scope 格式（`@username/skill-name`）
- [ ] `version` 遵循语义化版本规范
- [ ] `description` 清晰描述技能功能
- [ ] `files` 字段只包含必需文件
- [ ] `keywords` 包含相关搜索词
- [ ] `repository.url` 指向正确的仓库
- [ ] `engines.node` 指定版本要求

#### 功能检查

- [ ] 本地安装测试通过（`npm run install:local`）
- [ ] 全局安装测试通过（`npm run install:global`）
- [ ] 卸载功能正常
- [ ] Claude Code 中调用技能正常
- [ ] 任务指令执行正确
- [ ] 输出格式符合预期

#### 文档检查

- [ ] README.md 包含安装说明
- [ ] README.md 包含使用示例
- [ ] SKILL.md 任务指令清晰易懂
- [ ] 所有文件包含适当的注释

### 1.2 自动化检查

```bash
# 运行所有测试
npm test

# 验证 package.json
cat package.json | jq empty

# 验证 SKILL.md 格式
head -n 10 SKILL.md | grep "^---$"

# 验证必需文件
ls package.json SKILL.md scripts/install-skill.js scripts/uninstall-skill.js
```

### 1.3 清理临时文件

```bash
# 删除临时文件和目录
rm -rf node_modules/
rm -rf .claude/
rm -rf .agents/
rm -rf dist/
rm -rf build/
rm -f *.log
```

---

## 2️⃣ 版本管理

### 2.1 语义化版本规范

版本格式：`MAJOR.MINOR.PATCH`

- **MAJOR（主版本）**：不兼容的 API 修改
- **MINOR（次版本）**：向下兼容的功能性新增
- **PATCH（修订版）**：向下兼容的问题修正

#### 示例

| 版本变化          | 类型  | 说明                           |
| ----------------- | ----- | ------------------------------ |
| `1.0.0` → `2.0.0` | MAJOR | 重构任务指令结构，不兼容旧版本 |
| `1.0.0` → `1.1.0` | MINOR | 新增功能，保持向下兼容         |
| `1.0.0` → `1.0.1` | PATCH | 修复 bug，不影响功能           |

### 2.2 版本更新命令

```bash
# 自动更新版本号（推荐）
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# 手动更新版本号
# 编辑 package.json，修改 version 字段
# 然后运行：
npm version <new-version>
```

### 2.3 同步 SKILL.md 版本

确保 `SKILL.md` 中的 `version` 字段与 `package.json` 一致：

```yaml
---
name: my-skill
description: 技能功能描述
allowed-tools: Bash, Read, Write
version: 1.0.1 # 与 package.json 一致
---
```

### 2.4 创建 CHANGELOG

创建 `CHANGELOG.md` 记录版本变化：

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-01-26

### Added

- 添加新功能 A

### Fixed

- 修复安装路径问题

### Changed

- 更新 README.md 文档

## [1.0.0] - 2026-01-20

### Added

- 初始版本发布
- 实现基本功能 X、Y、Z
```

---

## 3️⃣ 构建和打包

### 3.1 预览将要发布的文件

```bash
# 查看 tarball 包含的文件
npm pack --dry-run

# 或实际打包（不发布）
npm pack
```

**预期输出示例**：

```
npm notice
npm notice 📦 @<your-org>/my-skill@1.0.0
npm notice === Tarball Contents ===
npm notice 1.2kB SKILL.md
npm notice 856B  scripts/install-skill.js
npm notice 445B  scripts/uninstall-skill.js
npm notice 1.1kB package.json
npm notice === Tarball Details ===
npm notice name: @<your-org>/my-skill
npm notice version: 1.0.0
npm notice filename: <your-org>-my-skill-1.0.0.tgz
npm notice package size: 3.6 kB
npm notice unpacked size: 3.6 kB
npm notice === Tarball Contents ===
```

### 3.2 验证打包内容

```bash
# 解压 tarball 查看内容
tar -tzf <your-org>-my-skill-1.0.0.tgz

# 或解压到目录
tar -xzf <your-org>-my-skill-1.0.0.tgz
cd package/
ls -la
```

#### 验证要点

- [ ] 包含 SKILL.md
- [ ] 包含 scripts/ 目录
- [ ] 不包含 node_modules/
- [ ] 不包含 .git/
- [ ] 不包含测试文件
- [ ] 包大小合理（通常 < 50KB）

### 3.3 清理临时文件

```bash
# 删除生成的 tarball
rm -f *.tgz

# 刋试解压的目录
rm -rf package/
```

---

## 4️⃣ 发布到 npm

### 4.1 准备工作

#### 检查 npm 账户

```bash
# 检查当前登录状态
npm whoami

# 如果未登录，执行登录
npm login
```

#### 创建 npm scope（如果需要）

```bash
# 将 scope 关联到你的用户名
npm profile set org <your-name>
```

### 4.2 发布命令

#### 标准发布

```bash
# 发布到 npm
npm publish

# 带详细信息发布
npm publish --verbose
```

#### 首次发布 scoped package

```bash
# 首次发布 scoped package 时，需要指定访问权限
npm publish --access public
```

#### 发布特定标签

```bash
# 发布为 beta 版本
npm publish --tag beta

# 发布为 next 版本
npm publish --tag next
```

### 4.3 发布过程

**正常发布流程**：

```
npm notice
npm notice 📦 @<your-org>/my-skill@1.0.0
npm notice === Tarball Contents ===
npm notice 1.2kB SKILL.md
npm notice 856B  scripts/install-skill.js
npm notice 445B  scripts/uninstall-skill.js
npm notice 1.1kB package.json
npm notice === Tarball Details ===
npm notice name: @<your-org>/my-skill
npm notice version: 1.0.0
npm notice package size: 3.6 kB
npm notice unpacked size: 3.6 kB
npm notice shasum: abc123...
npm notice integrity: sha512-...
npm notice === Tarball URL ===
npm notice https://registry.npmjs.org/@<your-org>/my-skill/-/my-skill-1.0.0.tgz
npm notice
+ @<your-org>/my-skill@1.0.0
```

### 4.4 发布后验证

#### 在 npm 上查看

```bash
# 查看包信息
npm view @<your-org>/my-skill

# 打开 npm 页面
npm repo @<your-org>/my-skill
```

#### 测试安装

```bash
# 全局安装
npm install -g @<your-org>/my-skill

# 项目级安装
mkdir /tmp/test-skill
cd /tmp/test-skill
npm install @<your-org>/my-skill

# 验证安装
ls ~/.claude/skills/my-skill/SKILL.md
```

#### 验证功能

```bash
# 在 Claude Code 中测试
claude
> /skills
> my-skill
```

---

## 5️⃣ 发布后验证

### 5.1 功能验证清单

- [ ] npm 页面正常显示
- [ ] README.md 正确渲染
- [ ] 安装命令正常工作
- [ ] 安装脚本自动执行
- [ ] SKILL.md 正确安装
- [ ] Claude Code 能识别技能
- [ ] 技能功能正常工作

### 5.2 多平台验证

建议在不同平台测试安装：

| 平台    | 测试命令                             | 状态 |
| ------- | ------------------------------------ | ---- |
| Ubuntu  | `npm install -g @<your-org>/my-skill` | ⬜   |
| macOS   | `npm install -g @<your-org>/my-skill` | ⬜   |
| Windows | `npm install -g @<your-org>/my-skill` | ⬜   |

### 5.3 文档更新

- [ ] 更新 GitHub README
- [ ] 添加到技能列表
- [ ] 发布发布公告

---

## 6️⃣ 版本迭代

### 6.1 发布新版本

```bash
# 1. 更新版本号
npm version patch  # 或 minor / major

# 2. 更新 CHANGELOG.md
# 编辑 CHANGELOG.md，添加新版本的变化

# 3. 提交到 Git
git add .
git commit -m "chore: release version 1.0.1"
git tag v1.0.1
git push origin main --tags

# 4. 发布到 npm
npm publish
```

### 6.2 回滚版本

如果发现问题需要回滚：

```bash
# 方法一：弃用版本（推荐）
npm deprecate @<your-org>/my-skill@1.0.1 "Critical bug, use 1.0.2 instead"

# 方法二： unpublish（仅在发布 24 小时内可用）
npm unpublish @<your-org>/my-skill@1.0.1

# 方法三：发布新版本修复问题
npm version patch
# 修复问题
npm publish
```

---

## 7️⃣ 常见发布问题

### Q1: 发布失败 "403 Forbidden"

**原因**: 包名已被占用或权限不足

**解决方案**:

```bash
# 检查包名是否可用
npm view @<your-org>/my-skill

# 如果包名已被占用，更换包名
# 修改 package.json 中的 name 字段

# 或联系包的所有者转让包名
```

### Q2: 发布失败 "E402"

**原因**: 包已存在且版本号未更新

**解决方案**:

```bash
# 更新版本号
npm version patch

# 重新发布
npm publish
```

### Q3: files 字段不生效

**原因**: files 字段格式错误或路径不正确

**解决方案**:

```json
{
    "files": ["SKILL.md", "scripts/"]
}
```

### Q4: 发布后安装失败

**原因**: SKILL.md 格式错误或脚本问题

**解决方案**:

```bash
# 本地测试安装
npm pack
npm install -g ./<your-org>-my-skill-1.0.0.tgz

# 查看详细错误
npm install -g @<your-org>/my-skill --verbose
```

### Q5: CI/CD 发布失败

**原因**: npm token 未配置或权限不足

**解决方案**:

```bash
# 在 GitHub Settings 中添加 NPM_TOKEN
# Settings → Secrets and variables → Actions → New repository secret
# Name: NPM_TOKEN
# Value: <your-npm-token>

# 在 CI 脚本中使用
echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc
npm publish
```

---

## 8️⃣ 发布检查清单

### 发布前

- [ ] 所有测试通过
- [ ] package.json 配置正确
- [ ] SKILL.md 格式正确
- [ ] 版本号已更新
- [ ] CHANGELOG.md 已更新
- [ ] README.md 已更新
- [ ] 临时文件已清理

### 发布中

- [ ] npm pack 预览正确
- [ ] npm publish 成功
- [ ] 无错误信息

### 发布后

- [ ] npm 页面正常显示
- [ ] 安装测试通过
- [ ] 功能测试通过
- [ ] 多平台测试通过
- [ ] 文档已更新
- [ ] 公告已发布

---

## 9️⃣ 最佳实践

### 1. 版本管理

- 遵循语义化版本规范
- 每次发布更新版本号
- 维护 CHANGELOG.md
- 使用 Git tag 标记版本

### 2. 发布流程

- 先在测试环境验证
- 使用 `--dry-run` 预览
- 逐步发布（alpha → beta → stable）
- 发布后立即验证

### 3. 安全性

- 不要在包中包含敏感信息
- 使用 `.npmignore` 排除敏感文件
- 定期更新依赖
- 使用 `npm audit` 检查漏洞

### 4. 文档

- 保持 README.md 更新
- 提供清晰的安装说明
- 提供使用示例
- 记录版本变化

### 5. 社区

- 响应用户反馈
- 修复 bug 及时
- 接受 PR 和建议
- 维护问题列表

---

## 📚 相关文档

- [01-project-structure.md](./01-project-structure.md) - 项目结构规范
- [02-development-workflow.md](./02-development-workflow.md) - 开发流程规范
- [03-testing-guide.md](./03-testing-guide.md) - 测试流程规范

---

## 🎯 下一步

发布完成后：

1. **收集反馈**: 监控用户反馈和问题
2. **持续改进**: 根据反馈优化技能
3. **版本迭代**: 定期发布新版本

---

**开始发布**: 运行 `npm publish` 发布你的技能

**示例发布命令**:

```bash
# 更新版本
npm version patch

# 发布到 npm
npm publish --access public

# 推送到 GitHub
git push origin main --tags
```
