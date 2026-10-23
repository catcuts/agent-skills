# My Agent Skills

这是一个 AI Agent 技能集合仓库，包含多个实用技能。

## 技能列表

| 技能 | 说明 |
| --- | --- |
| [commit](skills/commit/) | 读取 staged 代码差异，自动生成符合 Conventional Commits 规范的提交文本 |
| [handover](skills/handover/) | 跨会话工作交接工具。支持"归档当前进度"和"恢复历史进度"两个模式 |
| [hello-world](skills/hello-world/) | 简单示例技能，用于验证技能安装是否成功 |
| [kimi-web-chat](skills/kimi-web-chat/) | 通过 kimi-webbridge 与 Kimi 网页版自动对话：自动输入、发送并取回回复 |
| [recap](skills/recap/) | 从 Claude Code 使用历史与 Chrome 浏览记录生成日常活动报告 |
| [to-markdown](skills/to-markdown/) | 将 HTML 网页/剪贴板内容转换为结构化 Markdown，三层下载降级架构 |
| [to-requirement](skills/to-requirement/) | 从文章/文档中智能提炼显性需求并挖掘隐性需求 |

**安装方式**：

- 通过 skills CLI: `npx skills add catcuts/agent-skills` 选择所需技能
- handover 也发布为 NPM 包: `npm install -g @catcuts-skills/handover`

## 技能管理工具

本项目兼容以下技能管理工具：

- **[skills](https://github.com/vercel-labs/skills)** (Vercel): `npx skills add <repo>`（需 Node 22.20+）
- **openskills**: `npx openskills install <repo>`

技能遵循 [Agent Skills 开放规范](https://agentskills.io)，支持 OpenCode、Claude Code、Codex、Cursor 及 [75+ 个其他工具](https://github.com/vercel-labs/skills)。SKILL.md 中使用了部分 Claude Code 扩展字段（`when_to_use`、`context: fork` 等），不支持的 harness 会安全忽略，不影响跨平台使用。

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
