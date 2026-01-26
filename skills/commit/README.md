# Commit Skill

自动生成符合 Conventional Commits 规范的提交信息。

## 项目简介

这是一个实用的 Claude Code 技能，能够读取 Git 暂存区的代码差异，自动生成符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范的提交信息。

## 功能特性

- **智能分析**: 分析 Git 暂存区的代码差异
- **规范生成**: 自动生成符合 Conventional Commits 规范的提交文本
- **类型识别**: 识别 feat、fix、docs、style、refactor、test、chore 等提交类型
- **格式化输出**: 提供清晰、规范的提交信息格式

## 安装方法

### 快速安装

从 npm 安装包时会自动将 skill 注册到 Claude Code：

```bash
# 全局安装（推荐）
npm install -g @<your-username>/commit

# 项目级安装
npm install @<your-username>/commit
```

### 本地开发安装

如果正在开发本 skill，可以使用 npm scripts 手动安装：

```bash
# 全局安装
npm run install:global

# 项目级安装
npm run install:local
```

### 手动安装

如果自动安装失败，可以手动运行：

```bash
# 全局安装
npx add-skill . -a claude-code -g -y

# 项目级安装
npx add-skill . -a claude-code -y
```

**支持平台**: 基于 [Vercel 开源的 add-skill](https://github.com/vercel-labs/add-skill)，本技能支持 Opencode、Claude Code、Codex、Cursor 及其他 [19 个工具](https://github.com/vercel-labs/add-skill?tab=readme-ov-file#available-agents)。

### 测试安装

运行测试以验证安装配置（不会实际安装）：

```bash
npm test
```

### 卸载

```bash
# 全局卸载
npm uninstall -g @<your-username>/commit

# 项目级卸载
npm uninstall @<your-username>/commit
```

卸载时会自动清理 skill 文件。

## 使用示例

安装完成后，在 Claude Code 中输入：

```
commit
```

或者：

```
生成 commit message
```

或者：

```
创建提交
```

**预期行为**：

1. 技能会执行 `git diff --staged` 获取暂存区差异
2. 分析代码变更的类型和范围
3. 生成符合 Conventional Commits 规范的提交信息
4. 提供格式化的输出供用户确认

**示例输出**：

```
feat(skill): 添加提交信息生成功能

- 分析 Git 暂存区的代码差异
- 识别变更类型和影响范围
- 生成符合规范的提交信息

Closes #123
```

## Conventional Commits 规范

本技能遵循 Conventional Commits 规范，支持以下提交类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat: 添加用户登录功能 |
| `fix` | 修复 bug | fix: 修复登录页面错误 |
| `docs` | 文档更新 | docs: 更新 README.md |
| `style` | 代码格式调整 | style: 统一代码缩进 |
| `refactor` | 重构代码 | refactor: 优化数据处理逻辑 |
| `test` | 测试相关 | test: 添加单元测试 |
| `chore` | 构建/工具相关 | chore: 更新依赖版本 |

**提交信息格式**：

```
<type>(<scope>): <subject>

<body>

<footer>
```

## 技术细节

### 安装原理

本技能使用 [Vercel 开源的 add-skill](https://github.com/vercel-labs/add-skill) 工具进行安装管理，支持 Opencode、Claude Code、Codex、Cursor 及其他 [19 个工具](https://github.com/vercel-labs/add-skill?tab=readme-ov-file#available-agents)。

1. `package.json` 中的 `postinstall` 钩子自动运行安装脚本
2. 安装脚本调用 `add-skill` 将 `SKILL.md` 复制到目标目录
3. Claude Code 自动检测并加载技能

### 安装路径

**全局安装**:
- 实际存储: `~/.agents/skills/commit/`
- Claude Code 链接: `~/.claude/skills/commit/` (符号链接)

**项目级安装**:
- 实际存储: `.agents/skills/commit/`
- Claude Code 链接: `.claude/skills/commit/` (符号链接)

### 项目结构

```
skills/commit/
├── package.json              # NPM 包配置
├── SKILL.md                  # 技能定义文件
├── README.md                 # 使用文档
├── LICENSE                   # MIT 许可证
├── .gitignore                # Git 忽略规则
└── scripts/
    ├── install-skill.js      # 安装脚本
    └── uninstall-skill.js    # 卸载脚本
```

## 系统要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Claude Code CLI

## 开发

本技能基于 [agent-skill-npm-boilerplate](https://github.com/<your-username>/agent-skill-npm-boilerplate) 开发。

## 相关资源

- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [Conventional Commits 中文版](https://conventionalcommits.cn/)
- [Commitlint](https://commitlint.js.org/)
- [Claude Code 技能开发规范](https://github.com/<your-username>/agent-skills/tree/main/docs/skill-development-standard)

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
