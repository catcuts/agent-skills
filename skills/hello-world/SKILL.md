---
name: hello-world
description: 简单的 Hello World 示例技能，用于验证技能安装是否成功。显示欢迎信息、环境信息和使用示例。
allowed-tools: Bash
version: 1.0.0
---

# Hello World Skill

欢迎使用 Hello World Skill！这是一个简单的示例技能，用于验证 Claude Code 技能系统是否正常工作。

## 任务指令

当被调用时，执行以下步骤：

1. **显示欢迎信息**

    ```
    ✨ Hello World Skill 已成功安装！

    这是你的第一个 Claude Code 技能。让我们验证一下环境配置是否正确。
    ```

2. **收集环境信息**

    使用 `Bash` 工具执行以下命令：
    - `node --version` - 显示 Node.js 版本
    - `npm --version` - 显示 npm 版本
    - `pwd` - 显示当前工作目录
    - `date` - 显示当前日期时间

3. **验证安装路径**

    检查 skill 文件是否已正确安装：
    - 全局安装：`~/.claude/skills/hello-world/SKILL.md`
    - 项目级安装：`.claude/skills/hello-world/SKILL.md`

    使用 Bash 执行：

    ```bash
    ls -la ~/.claude/skills/hello-world/SKILL.md 2>/dev/null || ls -la .claude/skills/hello-world/SKILL.md 2>/dev/null
    ```

    如果文件存在，显示：

    ```
    ✓ 技能文件已正确安装
    ```

4. **显示下一步建议**

    ```
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
