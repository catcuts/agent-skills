# My Agent Skills

这是一个 AI Agent 技能集合仓库，包含多个实用技能。

## 技能列表

### 1. commit

读取 staged 代码差异，自动生成符合 Conventional Commits 规范的提交文本。

**安装方式**：

- 通过 skills: `npx skills install catcuts/agent-skills` 选择 commit 技能

### 2. handover

跨会话工作交接工具。支持"归档当前进度"和"恢复历史进度"两个模式。

**安装方式**：

- 作为 NPM 包: `npm install -g @catcuts-skills/handover`
- 通过 skills: `npx skills install catcuts/agent-skills` 选择 handover 技能

## 技能管理工具

本项目兼容以下技能管理工具：

- **[skills](https://github.com/vercel-labs/skills)** (Vercel): `npx skills install <repo>`
- **openskills**: `npx openskills install <repo>`

基于 [Vercel 开源的 skills](https://github.com/vercel-labs/skills)，本项目技能支持 Opencode、Claude Code、Codex、Cursor 及其他 [23 个工具](https://github.com/vercel-labs/add-skill?tab=readme-ov-file#supported-agents)。

## 开发

本仓库使用 npm workspaces 管理多个技能包。

```bash
# 安装所有依赖
npm install

# 发布更新
npm publish --workspace skills/handover
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
