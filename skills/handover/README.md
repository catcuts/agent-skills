# Handover Skill

跨会话工作交接工具，支持 AI Agent 工作状态的保存与恢复。

## 功能

- **导出模式**：保存当前会话的工作状态到本地存档
- **恢复模式**：从历史存档中恢复工作状态

## 安装

### 自动安装（推荐）

安装本 npm 包时会自动将 skill 注册到 Claude Code：

```bash
# 全局安装（默认）
npm install -g @catcheers/handover

# 项目级安装
SKILL_SCOPE=LOCAL npm install @catcheers/handover
```

**环境变量 `SKILL_SCOPE`**:

- `GLOBAL`（默认）: 安装到用户目录 `~/.claude/skills/handover`
- `LOCAL`: 安装到项目目录 `.claude/skills/handover`

### 手动安装

如果自动安装失败,可以手动运行：

```bash
# 全局安装
npx add-skill . -a claude-code -g -y

# 项目级安装
npx add-skill . -a claude-code -y
```

### 测试安装

运行测试以验证安装配置（不会实际安装）：

```bash
npm test
```

### 卸载

```bash
# 全局卸载
npm uninstall -g @catcheers/handover

# 项目级卸载
npm uninstall @catcheers/handover
```

卸载时会自动清理 skill 文件。

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
- 使用 Vercel 的 `add-skill` 工具进行安装管理

### 安装路径

**全局安装 (SKILL_SCOPE=GLOBAL)**:

- 实际存储: `~/.agents/skills/handover/`
- Claude Code 链接: `~/.claude/skills/handover/` (符号链接)

**项目级安装 (SKILL_SCOPE=LOCAL)**:

- 实际存储: `.agents/skills/handover/`
- Claude Code 链接: `.claude/skills/handover/` (符号链接)

### 系统要求

- Node.js >= 18.0.0

## 开发

本技能基于 [agent-skill-npm-boilerplate](https://github.com/catcuts/agent-skill-npm-boilerplate) 开发。
