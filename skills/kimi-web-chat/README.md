# Kimi Web Chat

Claude Code 技能：通过 [kimi-webbridge](https://www.kimi.com/zh-cn/features/webbridge) 与 Kimi 网页版自动对话 —— 自动输入消息、点击发送、轮询取回回复，展示在当前会话中。

## 项目简介

技能本体只做工作流程（意图识别、多轮对话策略、异常引导），全部浏览器操作细节封装在 CLI（`bin/kimi-web-chat.js`）中：

- Node 原生 `fetch` 直连 kimi-webbridge 守护进程（`127.0.0.1:10086`），无 shell 中文编码问题
- 幂等自举：daemon 未启动自动拉起 → kimi.com 标签页自动打开（标签组「Kimi 网页对话」）→ 桥接脚本（`references/bridge-inject.js`）自动注入
- 回复完成判定：文本连续 3 次（间隔 500ms）无变化；默认剥离思考块

## 功能特性

- **ask**：发送消息并等待回复（支持 `--timeout` / `--thinking` / `--new` / `--json`）
- **reply**：取最新回复（不发送）
- **new**：新建对话，清空上下文
- **status**：daemon / 标签页 / 注入状态自检
- **close**：关闭标签组

## 安装方法

### 全局安装

```bash
npm run install:global
```

### 项目级安装

```bash
npm run install:local
```

### 测试安装配置（不实际安装）

```bash
npm test
```

## 使用示例

安装后在 Claude Code 中说：

```
问 Kimi：帮我总结这段话……
让 Kimi 用一句话介绍它自己
```

也可以直接调用 CLI：

```bash
node bin/kimi-web-chat.js ask "你好，用一句话介绍你自己。" --json
# {"text":"你好，我是 Kimi……","ms":11963,"partial":false}

node bin/kimi-web-chat.js status
# daemon:  ✓ 运行中
# tab:     ✓ 已打开
# ...
```

### CLI 退出码

| 退出码 | 含义 |
|---|---|
| 0 | 成功 |
| 2 | daemon / 浏览器扩展不可用 |
| 3 | 未登录 Kimi |
| 4 | 回复超时 |
| 5 | 页面结构变更（选择器需维护） |

## 技术细节

- 依赖：已安装的 kimi-webbridge（守护进程 + 浏览器扩展），参见 https://www.kimi.com/zh-cn/features/webbridge
- 页面选择器（2026-08 实测）：输入框 `.chat-input-editor`，发送按钮 `.send-button-container`，回复 `.segment-assistant .segment-content-box`，思考块 `.thinking-container`

## 系统要求

- Node.js >= 18.0.0
- Claude Code CLI
- kimi-webbridge（守护进程 + 浏览器扩展）
- 浏览器已登录 kimi.com

## 许可证

MIT License
