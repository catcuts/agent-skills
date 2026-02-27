---
name: to-markdown
description: 将 HTML 网页内容转换为结构化的 Markdown 文档。支持三种模式：(1) URL + CSS选择器下载转换，(2) URL自动分析标签下载转换，(3) 剪贴板HTML直接转换。采用三层下载架构：Python(urllib) → agent-browser → Playwright，确保下载成功率。当用户需要保存网页内容为Markdown时使用。
---

# HTML 转 Markdown 技能

## 核心原则

**内容完整性 > 一切**：
- 绝不删除、修改或改写任何正文文字
- 保持原文所有文本，一字不差
- 只转换格式，不改变内容

**重要规则**：
- ❌ 禁止使用 Task 工具
- ❌ 禁止编写转换脚本
- ❌ 禁止使用外部工具转换
- ✅ AI 直接读取 HTML 并智能转换

## 参数模式检测

从用户输入提取参数：
- `--html_url=<URL>`: 要下载的网页 URL
- `--html_main_content_tag=<CSS选择器>`: 正文标签选择器

**三种模式**：
1. **URL + 标签**: 提供 URL 和选择器
2. **仅 URL**: 只提供 URL（自动分析标签）
3. **剪贴板**: 无参数（从剪贴板读取）

## 依赖检查

**Python 依赖**（必需）：
```bash
python -c "import bs4; import pyperclip; print('OK')"
```

如果失败：
```bash
pip install beautifulsoup4 pyperclip
```

**可选依赖**（按需使用）：
- agent-browser（需要时如无安装则跳过）
- Playwright（需要时如无安装则安装后用）

## 三层下载架构

**第 1 层：Python urllib**（快速、轻量）
- 脚本：utils/download_html_simple.py`
- 适用：静态网站、公开内容

**第 2 层：agent-browser**（智能、灵活）
- 触发：Python 失败或检测到反爬
- 适用：动态网站、需要登录

**第 3 层：Playwright**（完整浏览器）
- 触发：agent-browser 不可用或失败
- 适用：动态网站、需要登录、前两者不可用时

## 工作流程路由

### 模式 1：URL + 标签

执行 URL 带标签工作流程，见 [URL带标签工作流程](references/workflows.md#模式-1：url带标签工作流程)

### 模式 2：仅 URL

执行 URL 不带标签工作流程，见 [URL不带标签工作流程](references/workflows.md#模式-2：url不带工作流程)

### 模式 3：剪贴板

执行剪贴板工作流程，见 [剪贴板工作流程](references/workflows.md#模式-3：剪贴板工作流程)
