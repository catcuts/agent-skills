# Handover Skill

跨会话工作交接工具，支持 AI Agent 工作状态的保存与恢复。

## 功能

- **导出模式**：保存当前会话的工作状态到本地存档
- **恢复模式**：从历史存档中恢复工作状态

## 安装

### 作为 NPM 包安装（推荐）

```bash
npm install -g @catcheers/handover
```

### 通过技能管理工具安装

```bash
npx skills install catcuts/agent-skills
# 然后选择 handover 技能
```

## 使用

**导出工作状态：**
```
请帮我交接当前工作
```

**恢复工作状态：**
```
请接手之前的 xx 工作
```

## 技术细节

- 存档保存在项目根目录的 `.handover/` 中
- 安装时会自动将 SKILL.md 复制到 `~/.claude/skills/handover/`

## 开发

本技能基于 [agent-skill-npm-boilerplate](https://github.com/neovateai/agent-skill-npm-boilerplate) 开发。
