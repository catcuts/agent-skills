---
name: recap
description: 生成综合日常活动报告，支持多种数据源分析。包括 (1) Claude Code 使用历史分析，从 history.jsonl 提取会话数、交互频率、活跃时段和项目分组信息；(2) Chrome 浏览器历史分析，显示访问的网站、类别和时段分布。当用户问"我昨天/上周做了什么"、"显示我的活动历史"、"回顾我的工作"、"查看我的浏览器历史"、"我访问了哪些网站"，或需要回顾 Claude Code 或 Chrome 浏览器的使用模式时使用此技能。
---

# 日常活动回顾

从多种数据源生成综合活动报告，帮助您回顾工作模式和浏览习惯。

## 概述

此技能提供两种类型的活动报告：

1. **Claude Code 活动报告** - 分析您的 Claude Code 使用会话
2. **浏览器历史报告** - 分析 Chrome 浏览器浏览活动

## Claude Code 活动报告

分析 `history.jsonl` 中的 Claude Code 使用历史。

### 快速开始

生成昨天的报告（默认）：

```bash
python scripts/recap.py
```

生成指定日期的报告：

```bash
python scripts/recap.py 2026-02-24
```

### 报告内容

- **统计概览**：总会话数、交互次数、活跃时段
- **按项目分组**：按项目目录分组的所有会话
- **详细时间线**：每次交互的时间戳

### 脚本位置

`scripts/recap.py` 脚本会自动定位以下位置的 `history.jsonl`：
- `~/.claude/history.jsonl` (Linux/Mac)
- `~/AppData/Roaming/Claude/history.jsonl` (Windows)

### 输出格式

报告使用 Markdown 格式，带 emoji 指示符以提高可读性：

```markdown
## 📅 Claude Code 活动报告 - 2026-02-24

**统计概览**
- 会话数量: 26 个
- 交互次数: 60 次
- 活跃时段: 09:07 - 18:03

### 📁 /path/to/project
**会话 abc12345** (5 次交互)
  [09:15:28] 用户消息内容
  [09:20:31] 另一次交互
```

## 浏览器历史报告

从所有活跃的 Chrome 配置文件分析 Chrome 浏览器历史。

### 快速开始

生成昨天的报告（默认）：

```bash
python scripts/browser_history.py
```

生成指定日期的报告：

```bash
python scripts/browser_history.py 2026-02-24
```

生成今天的报告：

```bash
python scripts/browser_history.py today
```

### 报告内容

- **配置文件检测**：自动查找所有 Chrome 配置文件（Default、Profile 3 等）
- **访问统计**：总访问次数、时间分布
- **分类活动**：按类别分组访问记录（GitHub、Google、本地服务器等）
- **时段分布**：按上午/下午/晚上/深夜显示活动

### 浏览器历史位置

脚本会自动检查以下路径：

**Chrome**：
- `C:\Users\<用户名>\AppData\Local\Google\Chrome\User Data\Default\History`
- `C:\Users\<用户名>\AppData\Local\Google\Chrome\User Data\Profile 3\History`
- `C:\Users\<用户名>\AppData\Local\Google\Chrome\User Data\Profile 4\History`
- 等等

**Edge**（尚未完全实现）：
- `C:\Users\<用户名>\AppData\Local\Microsoft\Edge\User Data\Default\History`

### 重要提示

1. **配置文件锁定**：如果 Chrome 当前正在运行，活动配置文件的历史文件将被锁定。脚本会跳过锁定的配置文件并报告哪些文件无法读取。

2. **先关闭 Chrome**：要获取包括当前活动配置文件在内的完整历史，请在运行脚本前关闭所有 Chrome 窗口。

3. **自动分类**：访问记录会按域名自动分类：
   - GitHub、GitLab、NPM
   - Google 服务（Cloud、Gemini 等）
   - 本地开发服务器（localhost）
   - 社交媒体（X/Twitter、LinkedIn、YouTube）
   - 以及更多

### 输出格式

```markdown
📱 浏览器活动报告 - 2026-02-24
================================================================================

✓ 已读取配置文件: Default, Profile 3
✓ 总访问次数: 239 次

【上午 (06:00-12:00)】 - 共 86 次访问
--------------------------------------------------------------------------------

  GitHub (13 次)
    [17:06] godkingjay/selenium-twitter-scraper
    [17:06] vladkens/twscrape: 2025! X / Twitter API scrapper
    ...

  本地开发服务器 (12 次)
    [17:29] 智慧物联管理平台
    [16:42] 智慧物聯管理平台
    ...
```

## 实现说明

### recap.py

脚本功能：
1. 从 `history.jsonl` 解析 JSONL 格式
2. 将毫秒时间戳转换为可读日期
3. 按 `sessionId` 分组活动
4. 支持跨平台执行（Windows/Linux/Mac）
5. 处理国际字符的 UTF-8 编码

### browser_history.py

脚本功能：
1. 扫描所有 Chrome 配置文件目录
2. 将锁定历史文件复制到临时位置以安全读取
3. 转换 Chrome 时间戳（自 1601-01-01 起的微秒数）为可读日期
4. 按域名模式对 URL 分类
5. 按时段分组活动（上午/下午/晚上/深夜）
6. 优雅处理锁定配置文件的权限错误
