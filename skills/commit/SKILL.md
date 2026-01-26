---
name: commit
description: 读取 Git 暂存区代码差异，自动生成符合 Conventional Commits 规范的提交信息。使用时说"提交"、"生成 commit message"或"创建提交"。
allowed-tools: Bash, Read
version: 1.0.0
---

# Commit Skill

自动生成符合 Conventional Commits 规范的 Git 提交信息。

## 任务指令

当用户要求生成 Git 提交信息时：

1. **获取暂存区差异**
   - 使用 `Bash` 工具执行 `git diff --staged`
   - 如果暂存区为空，提示用户先使用 `git add` 添加文件

2. **分析代码变更**
   - 分析变更的类型：feat（新功能）、fix（修复）、docs（文档）、style（格式）、refactor（重构）、test（测试）、chore（构建/工具）
   - 识别变更的范围和影响
   - 提取关键变更内容

3. **生成提交信息**
   - 按照以下格式生成提交信息：
     ```
     <type>(<scope>): <subject>

     <body>

     <footer>
     ```
   - type: 变更类型（feat/fix/docs/style/refactor/test/chore）
   - scope: 影响范围（可选）
   - subject: 简短描述（使用中文，不超过 50 字符）
   - body: 详细描述（可选，列出主要变更）
   - footer: 关联信息（如 Closes #123）

4. **输出结果**
   - 显示完整的提交信息
   - 提示用户可以使用生成的提交信息
   - 如果需要，解释选择的提交类型和原因

## Conventional Commits 类型参考

| 类型 | 说明 | 使用场景 |
|------|------|---------|
| `feat` | 新功能 | 添加新的功能或特性 |
| `fix` | 修复 bug | 修复问题或错误 |
| `docs` | 文档更新 | 修改文档或注释 |
| `style` | 代码格式 | 代码格式调整（不影响功能） |
| `refactor` | 重构 | 代码重构（不是新功能也不是修复） |
| `test` | 测试相关 | 添加或修改测试 |
| `chore` | 构建/工具 | 构建过程、工具链、依赖更新 |

## 示例

### 示例 1：新功能

**代码变更**: 添加用户登录功能

**生成提交信息**:
```
feat(auth): 添加用户登录功能

- 实现用户名密码登录
- 添加 JWT token 认证
- 支持记住登录状态

Closes #123
```

### 示例 2：修复 bug

**代码变更**: 修复登录页面错误提示显示问题

**生成提交信息**:
```
fix(auth): 修复登录错误提示不显示的问题

- 调整错误处理逻辑
- 优化错误信息展示

Fixes #124
```

### 示例 3：文档更新

**代码变更**: 更新 README.md

**生成提交信息**:
```
docs: 更新项目安装说明

- 添加依赖安装步骤
- 补充常见问题解答
```

## 最佳实践

1. **提交类型选择**
   - 优先选择明确的类型（feat/fix）
   - 避免使用模糊的 chore
   - 同一次变更只使用一个主要类型

2. **subject 编写**
   - 使用中文，简洁明了
   - 不要超过 50 个字符
   - 使用动词开头（添加、修复、更新等）
   - 不要以句号结尾

3. **body 编写**
   - 列举主要变更点
   - 说明变更的原因和目的
   - 每行一个变更点

4. **footer 使用**
   - 关联 issue: `Closes #123` 或 `Fixes #123`
   - 标注破坏性变更: `BREAKING CHANGE:`
   - 引用相关 commit

## 技术说明

- **支持的 Git 命令**: `git diff --staged`, `git status`
- **输出格式**: Markdown
- **语言**: 中文
- **编码**: UTF-8
