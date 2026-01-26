# Hello World Skill

简单的 Hello World 示例技能，用于验证 Claude Code 技能安装是否成功。

## 项目简介

这是一个入门级的 Claude Code 技能示例，旨在帮助新用户：

- 验证技能系统是否正常工作
- 了解技能的基本结构和安装流程
- 检查开发环境配置（Node.js、npm）

## 功能特性

- **欢迎信息**：显示友好的欢迎消息
- **环境检查**：自动检测并显示 Node.js 和 npm 版本
- **路径验证**：确认技能文件已正确安装
- **使用示例**：提供下一步学习建议

## 安装方法

### 快速安装

从 npm 安装包时会自动注册 skill 到 Opencode、Claude Code、Codex、Cursor 及其他 [19 个工具](https://github.com/vercel-labs/add-skill?tab=readme-ov-file#available-agents)。感谢 [Vercel 开源的 add-skill](https://github.com/vercel-labs/add-skill) 🌹

```bash
# 全局安装（推荐）
npm install -g @catcuts-skills/hello-world

# 项目级安装
npm install @catcuts-skills/hello-world
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

**安装范围说明**:

- **全局**: 安装到用户目录 `~/.claude/skills/hello-world`，所有项目可用
- **项目级**: 安装到项目目录 `.claude/skills/hello-world`，仅当前项目可用

### 测试安装

运行测试以验证安装配置（不会实际安装）：

```bash
npm test
```

### 卸载

```bash
# 全局卸载
npm uninstall -g @catcuts-skills/hello-world

# 项目级卸载
npm uninstall @catcuts-skills/hello-world
```

卸载时会自动清理 skill 文件。

## 使用示例

安装完成后，在 Claude Code 中输入：

```
hello-world
```

**预期输出**：

```
✨ Hello World Skill 已成功安装！

这是你的第一个 Claude Code 技能。让我们验证一下环境配置是否正确。

环境信息：
Node.js 版本: v20.x.x
npm 版本: 10.x.x
当前工作目录: /your/current/path
当前日期时间: 2026-01-26 10:30:00

✓ 技能文件已正确安装

🎉 恭喜！你的技能系统运行正常。

下一步建议：
1. 探索更多技能：访问 https://github.com/catcuts/agent-skills
2. 创建自定义技能：参考本技能的结构创建你自己的技能
3. 了解更多 Claude Code 功能：查看官方文档

技术信息：
- 技能名称：hello-world
- 版本：1.0.0
- 作者：catcuts
```

## 验证安装成功

安装成功的标志：

1. **文件存在**：检查技能文件是否已安装

    ```bash
    # 全局安装
    ls ~/.claude/skills/hello-world/SKILL.md

    # 项目级安装
    ls .claude/skills/hello-world/SKILL.md
    ```

2. **Claude Code 识别**：在 Claude Code 中输入 `/skills` 应该能看到 `hello-world` 技能

3. **功能正常**：输入 `hello-world` 能正确显示欢迎信息和环境信息

## 技术细节

### 安装原理

本技能使用 [Vercel 开源的 add-skill](https://github.com/vercel-labs/add-skill) 工具进行安装管理，支持 Opencode、Claude Code、Codex、Cursor 及其他 [19 个工具](https://github.com/vercel-labs/add-skill?tab=readme-ov-file#available-agents)。

1. `package.json` 中的 `postinstall` 钩子自动运行安装脚本
2. 安装脚本调用 `add-skill` 将 `SKILL.md` 复制到目标目录
3. Claude Code 自动检测并加载技能

### 安装路径

**全局安装**:

- 实际存储: `~/.agents/skills/hello-world/`
- Claude Code 链接: `~/.claude/skills/hello-world/` (符号链接)

**项目级安装**:

- 实际存储: `.agents/skills/hello-world/`
- Claude Code 链接: `.claude/skills/hello-world/` (符号链接)

### 项目结构

```
skills/hello-world/
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
- Claude Code CLI

## 下一步学习建议

1. **探索更多技能**
    - 访问 [agent-skills 仓库](https://github.com/catcuts/agent-skills) 查看更多技能示例
    - 尝试 `handover` 技能学习跨会话工作交接

2. **创建自定义技能**
    - 参考 `SKILL.md` 的 YAML frontmatter 格式
    - 学习如何使用 `allowed-tools` 声明需要的工具
    - 编写清晰的技能指令

3. **深入学习 Claude Code**
    - 阅读 [Claude Code 官方文档](https://claude.com/claude-code)
    - 了解技能开发最佳实践
    - 参与社区讨论

## 开发

本技能基于 [agent-skill-npm-boilerplate](https://github.com/catcuts/agent-skill-npm-boilerplate) 开发。

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
