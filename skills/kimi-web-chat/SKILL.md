---
name: kimi-web-chat
description: 与 Kimi 网页版（kimi.com）自动对话。当用户要求"问 Kimi"、"让 Kimi 回答/分析/总结/写作"或需要利用 Kimi 网页版能力时使用。自动完成输入、发送并取回回复展示到当前会话。
allowed-tools: Bash, Read
version: 1.0.0
---

# Kimi Web Chat

通过 kimi-webbridge 控制用户浏览器中的 kimi.com，与 Kimi 网页版进行多轮对话。

所有工作细节（daemon 自举、标签管理、脚本注入、发送、轮询取回复）已封装在 CLI 中：
**`<SKILL.md 所在目录>/bin/kimi-web-chat.js`**（下文记作 `CLI`，用 `node CLI <命令>` 调用）。

## 任务指令

### 模式 A：向 Kimi 提问（默认）

当用户说"问 Kimi：…"、"让 Kimi 看看…"等：

1. **判断对话策略**
    - 默认延续同一对话上下文（Kimi 记得之前聊过的内容）
    - 仅当用户明确切换了无关话题、或用户要求"新对话/清空上下文"时，附加 `--new`

2. **发送并等待回复**
    使用 `Bash` 工具执行：

    ```bash
    node "CLI" ask "用户的消息" --timeout 120000
    ```

    - 消息用双引号包裹；含特殊字符时先写入临时文件再用 `$(cat 文件)` 传入
    - Bash 超时需大于 `--timeout`（建议 240000ms 以上）
    - 该命令幂等：daemon 未启动会自动拉起，页面未注入脚本会自动注入

3. **展示回复**
    将 stdout 的回复正文原样展示给用户。stderr 出现 `WARN: 回复可能不完整` 时需告知用户。

### 模式 B：管理对话

- "新建/清空对话" → `node "CLI" new`
- "再看一下最新回复" → `node "CLI" reply`（加 `--thinking` 可含思考过程）
- "检查连接状态" → `node "CLI" status`
- "关闭 Kimi 标签页" → `node "CLI" close`（**仅在用户明确要求时执行**）

## 异常处理（按退出码）

| 退出码 | 含义 | 引导 |
|---|---|---|
| 2 | daemon 或浏览器扩展不可用 | 提示用户确认浏览器已打开、Kimi WebBridge 扩展已启用；仍失败则引导至 https://www.kimi.com/zh-cn/features/webbridge |
| 3 | 未登录 Kimi | 提示用户在浏览器中登录 kimi.com 后重试 |
| 4 | 回复超时 | 告知用户，询问是否用更大的 `--timeout` 重试 |
| 5 | 页面结构变更 | 告知用户 kimi.com 页面结构可能已更新，技能选择器需维护 |

## 附加说明

- 本技能打开的页面收拢在浏览器标签组「Kimi 网页对话」中
- 首次调用会新开一个 kimi.com 标签页；后续调用复用该标签页
- Bash 默认超时 2 分钟，ask 命令务必显式设置更长的 Bash 超时
