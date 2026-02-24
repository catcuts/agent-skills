---
name: to-markdown
description: 将剪贴板中的 HTML 网页内容转换为结构化的 Markdown 文档。当用户需要将网页内容（从浏览器控制台复制的 HTML 块）保存为 Markdown 格式时使用此技能。确保正文内容完整无遗漏、格式规范、结构清晰，支持保留图片、表格和代码块。
---

# 剪贴板转 Markdown 技能

## 使用此技能的时机

当用户说以下内容时触发此技能：
- "将剪贴板内容保存为 Markdown"
- "整理这个网页为 Markdown"
- "把这个 HTML 转成 Markdown"
- "保存剪贴板中的网页内容"
- 或其他类似的请求

## 核心原则

**最重要：内容完整性和准确性**
- 绝对不能删除、修改或改写任何正文文字内容
- 保持原文的所有文本，一字不差
- 只转换格式，不改变内容

## 重要规则（必须遵守）

**绝对禁止**：
1. 禁止使用 Task 工具启动任何 sub agent 来处理此任务
2. 禁止自己编写脚本来处理 HTML 到 Markdown 的转换
3. 禁止使用任何外部工具或库进行转换
4. 必须由 AI 直接读取 HTML 内容，智能理解和转换

**必须做到**：
1. 由 AI 直接读取临时文件中的 HTML 内容
2. 由 AI 智能理解 HTML 结构并转换为 Markdown
3. 保持转换规则的一致性和连续性
4. 确保内容完整，不遗漏任何段落

## 参数模式检测

**在开始任何工作流程之前，必须先检测用户使用的参数模式。**

从用户的原始输入中提取以下参数：
- `--html_url=<URL>`: 指定要下载的网页 URL
- `--html_main_content_tag=<CSS选择器>`: 指定正文标签的 CSS 选择器

**三种输入模式**：

1. **模式1**: 用户同时提供了 URL 和标签
   - 调用信号: `--html_url=xxx --html_main_content_tag=xxx`
   - 流程: 下载 HTML → 提取标签内容 → 清理 → AI 转换

2. **模式2**: 用户只提供了 URL，未提供标签
   - 调用信号: `--html_url=xxx` (无 `--html_main_content_tag`)
   - 流程: 下载 HTML → 智能分析标签 → 用户选择 → 模式1

3. **模式3**: 用户未提供任何参数
   - 调用信号: 无参数
   - 流程: 从剪贴板读取 (现有流程)

**参数提取方法**：
从用户的原始消息中使用正则表达式或字符串匹配提取参数：
- 检测是否包含 `--html_url=`
- 检测是否包含 `--html_main_content_tag=`
- 提取参数值（处理可能的引号和空格）

## 前置检查

**在开始工作流程之前，必须先检查 Python 依赖是否满足。**

首先确定此 SKILL.md 所在目录为 `SKILL_DIR`。

### 第 0 步：检查并安装 Python 依赖

检查依赖是否已安装：

```bash
python -c "import bs4; import pyperclip; print('OK')"
```

**如果检查失败（输出不是 "OK"），需要安装依赖**：

方法 1 - 使用 requirements.txt：
```bash
pip install -r "${SKILL_DIR}/requirements.txt"
```

方法 2 - 直接安装（推荐，如果镜像源有问题）：
```bash
pip install beautifulsoup4 pyperclip --index-url https://pypi.org/simple/
```

**依赖说明**：

| 包名 | 用途 |
|------|------|
| `beautifulsoup4` | HTML 清理，去除无用属性 |
| `pyperclip` | 跨平台剪贴板访问（备用） |

**注意**：即使依赖安装失败，技能仍可使用备用方法（PowerShell/系统命令）获取剪贴板内容，只是无法进行 HTML 清理。

## 工作流程路由

根据参数模式选择对应的工作流程：

### 如果是模式1 (URL + 标签)

跳转到 [模式1：URL + 标签工作流程](#模式1-url---标签工作流程)

### 如果是模式2 (URL 无标签)

跳转到 [模式2：URL 智能分析工作流程](#模式2-url-智能分析工作流程)

### 如果是模式3 (无参数)

跳转到 [模式3：剪贴板工作流程](#模式3-剪贴板工作流程) (现有流程)

---

## 工作流程

### 第 1 步：获取剪贴板 HTML 内容并保存到临时文件

**推荐方法：使用 Python 脚本（跨平台）**

首先确定此 SKILL.md 所在目录为 `SKILL_DIR`，然后执行：

```bash
python "${SKILL_DIR}/scripts/save_clipboard.py"
```

脚本会：
1. 自动检测操作系统
2. 使用最可靠的方法获取剪贴板内容
3. 保存到唯一的临时文件（自动生成唯一文件名）
4. 输出临时文件路径

**重要**：
- 保存生成的临时文件路径，后续步骤需要读取和删除它
- 示例输出：`C:\Users\xxx\AppData\Local\Temp\clipboard_content_20260120_143022.html`

**Windows 备用方法（如果脚本无法运行）**：

```bash
powershell -command "$tempFile = Join-Path $env:TEMP ('clipboard_content_{0}_{1}.html' -f (Get-Date -Format 'yyyyMMdd_HHmmss'), (Get-Random -Maximum 9999)); Get-Clipboard | Out-File -FilePath $tempFile -Encoding UTF8; Write-Output $tempFile"
```

**macOS/Linux 备用方法**：

```bash
tempFile="/tmp/clipboard_content_$(date +%Y%m%d_%H%M%S)_$RANDOM.html"; pbpaste > "$tempFile"; echo "$tempFile"
```

### 第 1.5 步：清理 HTML（去除无用属性）

**目的**：去除 HTML 中无用的样式和控制属性，减小内容大小，提高 AI 处理效率。

使用 Python + BeautifulSoup 清理 HTML：

```bash
python -c "
import sys
try:
    from bs4 import BeautifulSoup
except ImportError:
    print('ERROR: beautifulsoup4 not installed', file=sys.stderr)
    sys.exit(1)

import re

# 读取原始 HTML
with open(r'<临时文件路径>', 'r', encoding='utf-8') as f:
    html = f.read()

# 解析 HTML
soup = BeautifulSoup(html, 'html.parser')

# 需要保留的属性列表
KEEP_ATTRS = {
    'a': ['href', 'title'],
    'img': ['src', 'data-src', 'alt', 'title'],  # 保留 data-src 用于懒加载图片
    'code': ['class'],  # 保留代码语言标识
    'pre': ['class'],
    'blockquote': ['cite'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
}

# 需要完全移除的标签（保留内容）
REMOVE_TAGS = ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript', 'iframe', 'svg']

# 移除无用标签
for tag in soup.find_all(REMOVE_TAGS):
    tag.decompose()

# 清理所有标签的属性
for tag in soup.find_all(True):
    allowed_attrs = KEEP_ATTRS.get(tag.name, [])
    # 保留 class 中的语言标识（如 language-python）
    if tag.name in ['code', 'pre'] and tag.get('class'):
        lang_classes = [c for c in tag.get('class', []) if c.startswith('language-') or c.startswith('lang-')]
        if lang_classes:
            tag['class'] = lang_classes
        else:
            del tag['class']
    # 只保留允许的属性
    attrs_to_remove = [attr for attr in tag.attrs if attr not in allowed_attrs]
    for attr in attrs_to_remove:
        del tag[attr]

# 写回文件
with open(r'<临时文件路径>', 'w', encoding='utf-8') as f:
    f.write(str(soup))

print('HTML cleaned')
"
```

**注意**：
- 将 `<临时文件路径>` 替换为第 1 步生成的实际路径
- 需要安装 beautifulsoup4：`pip install beautifulsoup4`
- 如果清理失败，直接使用原始 HTML 继续后续步骤

**清理规则**：
- **移除的标签**（连同内容）：`<script>`, `<style>`, `<nav>`, `<footer>`, `<header>`, `<aside>`, `<noscript>`, `<iframe>`, `<svg>`
- **保留的属性**：
  - `<a>`: `href`, `title`
  - `<img>`: `src`, `data-src`, `alt`, `title`（`data-src` 用于懒加载图片）
  - `<code>`, `<pre>`: `class`（仅保留语言标识如 `language-python`）
  - `<blockquote>`: `cite`
  - `<td>`, `<th>`: `colspan`, `rowspan`
- **移除的属性**：`style`, `class`（除语言标识外）, `id`, `onclick` 等所有其他属性（注意：`data-src` 会保留）

### 第 2 步：智能转换为 Markdown

**重要**：此步骤必须由 AI 直接执行，不能委托给 sub agent 或脚本。

使用 Read 工具读取临时文件内容，然后由 AI 按照以下规则进行智能转换：

#### 标题转换
```
<h1>标题</h1> → # 标题
<h2>标题</h2> → ## 标题
...
<h6>标题</h6> → ###### 标题
```

#### 文本和段落
- **严格保持原文**：逐字逐句复制所有文本内容
- 段落之间保持空行分隔
- `<p>` 标签内容转换为独立段落

#### 强调和格式
- `<strong>` 或 `<b>` → **文字**
- `<em>` 或 `<i>` → *文字*
- `<mark>` 或高亮标签 → ==文字==
- 保留原有的格式层次

#### 列表转换
```
<ul>
  <li>项目1</li>
  <li>项目2</li>
</ul>

→

- 项目1
- 项目2
```

```
<ol>
  <li>第一项</li>
  <li>第二项</li>
</ol>

→

1. 第一项
2. 第二项
```

- 嵌套列表使用 2 空格缩进
- 保持原有的列表层级关系

#### 表格转换

将 HTML 表格转换为 Markdown 表格格式：

```html
<table>
  <tr>
    <th>列1</th>
    <th>列2</th>
  </tr>
  <tr>
    <td>数据1</td>
    <td>数据2</td>
  </tr>
</table>
```

转换为：

```markdown
| 列1 | 列2 |
|-----|-----|
| 数据1 | 数据2 |
```

- 保留所有行和列
- 第一行作为表头
- 添加分隔行 `|---|---|`
- 确保单元格内容完整

#### 代码块转换

```html
<pre><code class="language-python">
def hello():
    print("Hello")
</code></pre>
```

转换为：

````markdown
```python
def hello():
    print("Hello")
```
````

- 识别语言类型（从 class 属性或标签属性）
- 保留代码的原始格式和缩进
- 不修改任何代码内容

#### 图片转换

```html
<img src="https://example.com/image.png" alt="图片描述">
<!-- 或懒加载图片 -->
<img data-src="https://example.com/real-image.png" src="占位图" alt="图片描述">
```

转换为：

```markdown
![图片描述](https://example.com/image.png)
```

**图片 URL 提取规则（优先级从高到低）**：
1. **优先使用 `data-src`**：如果存在 `data-src` 属性，使用它作为图片 URL
2. **其次使用 `src`**：如果只有 `src`，使用它

**转换规则**：
- 提取 alt 属性作为描述
- 如果没有 alt，使用 "图片" 作为默认描述
- 保留原始图片 URL（可能是 http/https/ftp/data 等各种协议）
- 如果图片 URL 为空，**跳过该图片，不输出任何内容**

#### 链接转换

```html
<a href="https://example.com">链接文字</a>
```

转换为：

```markdown
[链接文字](https://example.com)
```

- 保留链接文字
- 保留 URL

#### 引用转换

```html
<blockquote>引用内容</blockquote>
```

转换为：

```markdown
> 引用内容
```

#### 其它情况

自行判断，合理处理。

### 第 3 步：内容完整性验证

转换完成后，对照原文检查：

✓ **文本完整性**：所有文字内容都已保留
✓ **结构完整性**：标题、段落、列表结构完整
✓ **无内容丢失**：没有遗漏任何段落或章节
✓ **格式正确**：Markdown 语法规范
✓ **特殊元素**：图片、表格、代码块都已转换

### 第 4 步：提取标题并生成文件名

**从 HTML 内容中自动提取标题作为文件名**：

1. **优先级顺序**：
   - 第一优先：`<title>` 标签内容
   - 第二优先：第一个 `<h1>` 标签内容
   - 第三优先：第一个 `<h2>` 标签内容
   - 最后备选：当前时间戳（如 `2026-01-20-143022`）

2. **文件名处理规则**：
   - 移除 HTML 标签和特殊字符
   - 将空格替换为连字符 `-`
   - 移除或替换文件名中的非法字符：`< > : " / \ | ? *`
   - 限制长度：最多 50 个字符
   - 添加 `.md` 后缀

3. **示例**：
   ```
   <title>如何使用 Python 进行数据分析</title>
   → 文件名：如何使用-Python-进行数据分析.md

   <h1>Understanding React Hooks</h1>
   → 文件名：Understanding-React-Hooks.md

   无标题时 → 文件名：2026-01-20-143022.md
   ```

### 第 5 步：确认保存路径

使用 AskUserQuestion 工具询问用户保存位置：

```javascript
{
  "questions": [
    {
      "question": "请选择保存方式",
      "header": "保存路径",
      "multiSelect": false,
      "options": [
        {
          "label": "使用提取的标题作为文件名",
          "description": "保存为：<提取的标题>.md（在当前目录）"
        },
        {
          "label": "自定义保存路径",
          "description": "您将输入自定义的完整文件路径"
        }
      ]
    }
  ]
}
```

**注意**：在选项中显示实际提取到的标题，让用户清楚知道默认文件名是什么。

### 第 6 步：保存到文件

使用 Write 工具将 Markdown 内容保存到用户指定的路径。

### 第 7 步：清理临时文件

保存完成后，使用之前记录的临时文件路径变量删除该文件：

**Windows (PowerShell):**
```bash
powershell -command "Remove-Item '<临时文件路径>' -ErrorAction SilentlyContinue"
```

**macOS/Linux:**
```bash
rm "<临时文件路径>"
```

**示例：**
```bash
# 如果临时文件路径是 C:\Users\catcuts\AppData\Local\Temp\clipboard_content_20260120_143022_4567.html
powershell -command "Remove-Item 'C:\Users\catcuts\AppData\Local\Temp\clipboard_content_20260120_143022_4567.html' -ErrorAction SilentlyContinue"
```

**重要：**
- 将 `<临时文件路径>` 替换为第1步中生成并保存的实际文件路径
- 无论处理过程成功与否，都应在最后清理临时文件，避免残留临时数据
- 使用 `-ErrorAction SilentlyContinue` (Windows) 或忽略错误 (macOS/Linux) 避免文件已被删除时报错

---

## 模式1：URL + 标签工作流程

**触发条件**：用户同时提供了 `--html_url` 和 `--html_main_content_tag` 参数

### 第 1 步：检查 Python 依赖

与[模式3的第0步](#第-0-步检查并安装-python-依赖)相同

### 第 2 步：从 URL 下载 HTML

使用 `download_html.py` 脚本下载 HTML 内容：

```bash
python "${SKILL_DIR}/scripts/download_html.py" "<URL>"
```

脚本会：
1. 下载指定 URL 的 HTML 内容
2. 自动检测编码（默认 UTF-8）
3. 保存到唯一的临时文件
4. 输出临时文件路径

**保存输出**：
- 记录临时文件路径：`DOWNLOADED_HTML_PATH`
- 从 stderr 中读取的 URL 信息可用于后续匹配标签规则

**错误处理**：
- 如果下载失败，提示用户检查网络连接或使用剪贴板模式
- 如果 URL 无效，提示用户输入正确的 URL

### 第 3 步：提取正文内容

使用 `extract_content.py` 脚本提取指定标签的内容：

```bash
python "${SKILL_DIR}/scripts/extract_content.py" "${DOWNLOADED_HTML_PATH}" "<CSS选择器>"
```

脚本会：
1. 使用 CSS 选择器提取 HTML 中的指定元素
2. 如果有多个匹配，自动合并所有内容
3. 生成包含提取内容的独立 HTML 文档
4. 输出新的临时文件路径

**保存输出**：
- 记录提取后的文件路径：`EXTRACTED_CONTENT_PATH`

**错误处理**：
- 如果选择器无效，提示用户：
  - 使用智能分析功能（模式2）
  - 手动输入其他选择器
  - 使用剪贴板模式

### 第 4 步：清理 HTML

与[模式3的第1.5步](#第-15-步清理-html去除无用属性)相同，但使用 `EXTRACTED_CONTENT_PATH` 而不是剪贴板文件路径。

### 第 5 步：智能转换为 Markdown

与[模式3的第2步](#第-2-步智能转换为-markdown)相同

### 第 6 步：提取标题并生成文件名

与[模式3的第4步](#第-4-步提取标题并生成文件名)相同，但可以优先使用 URL 的文件名部分。

### 第 7 步：确认保存路径

与[模式3的第5步](#第-5-步确认保存路径)相同

### 第 8 步：保存到文件

与[模式3的第6步](#第-6-步保存到文件)相同

### 第 9 步：清理临时文件

与[模式3的第7步](#第-7-步清理临时文件)相同，但要清理两个临时文件：`DOWNLOADED_HTML_PATH` 和 `EXTRACTED_CONTENT_PATH`

---

## 模式2：URL 智能分析工作流程

**触发条件**：用户只提供了 `--html_url` 参数，未提供 `--html_main_content_tag`

### 第 1 步：检查 Python 依赖

与[模式3的第0步](#第-0-步检查并安装-python-依赖)相同

### 第 2 步：从 URL 下载 HTML

与[模式1的第2步](#第-2-步从-url-下载-html)相同

### 第 3 步：查找正文标签库规则

**首先尝试从标签库查找匹配规则**：

1. 解析 URL 获取域名（如 `mp.weixin.qq.com`）
2. 读取标签库文件：`${SKILL_DIR}/content-tag-rules.json`
3. 查找匹配的域名规则
4. 如果找到匹配规则，按优先级排序，选择优先级最高的
5. 如果找到规则，使用该规则的选择器，跳转到[模式1的第3步](#第-3-步提取正文内容)

### 第 4 步：智能分析正文标签（如果标签库中未找到）

使用 `analyze_tags.py` 脚本智能分析可能的正文标签：

```bash
python "${SKILL_DIR}/scripts/analyze_tags.py" "${DOWNLOADED_HTML_PATH}" 5
```

脚本会：
1. 分析 HTML 结构，找出所有可能的正文容器
2. 使用多维度评分算法（文本长度、链接密度、段落数、标签名、属性关键词）
3. 过滤掉明显的导航、页脚等非正文元素
4. 返回评分最高的 5 个候选标签

**输出格式**（JSON）：
```json
{
  "candidates": [
    {
      "selector": "article",
      "score": 85,
      "stats": {
        "text_length": 2341,
        "link_count": 3,
        "link_ratio": 0.08,
        "paragraph_count": 8,
        "tag_name": "article"
      },
      "preview": "这是正文内容的预览..."
    }
  ]
}
```

### 第 5 步：用户选择标签

使用 AskUserQuestion 工具展示候选标签：

```javascript
{
  "questions": [
    {
      "question": "请选择正文内容所在的标签（按得分排序）",
      "header": "正文标签选择",
      "multiSelect": false,
      "options": [
        {
          "label": "article (得分: 85)",
          "description": "包含 8 个段落，约 2341 字，预览：这是正文内容的预览..."
        },
        {
          "label": "#main-content (得分: 72)",
          "description": "包含 5 个段落，约 1823 字"
        },
        {
          "label": ".post-content (得分: 65)",
          "description": "包含 4 个段落，约 1521 字"
        },
        {
          "label": "其他（手动输入选择器）",
          "description": "如果您知道准确的 CSS 选择器，可以选择此项后手动输入"
        }
      ]
    },
    {
      "question": "是否将此标签保存到正文标签库？",
      "header": "保存规则",
      "multiSelect": false,
      "options": [
        {
          "label": "是，保存规则",
          "description": "将此网站的标签规则保存，下次访问相同域名时自动使用"
        },
        {
          "label": "否，仅本次使用",
          "description": "不保存规则，仅本次转换使用"
        }
      ]
    }
  ]
}
```

**注意事项**：
- 如果用户选择"其他"，需要进一步询问具体的 CSS 选择器
- 选项中应显示详细的得分统计和内容预览
- 预览文本限制在 100 字符以内

### 第 6 步：保存标签规则（如果用户选择）

如果用户选择保存规则到标签库：

1. 读取现有的 `content-tag-rules.json`
2. 解析 URL 获取域名
3. 添加新规则到 `rules` 数组：
```json
{
  "domain": "example.com",
  "domain_pattern": "*",
  "selector": "用户选择的选择器",
  "description": "用户添加的规则",
  "priority": 95,
  "verified": true
}
```
4. 更新 `last_updated` 字段为当前日期
5. 保存回 `content-tag-rules.json`

**注意**：
- 用户添加的规则优先级设置为 95（高于默认规则，低于预置规则）
- 设置 `verified: true` 表示用户确认过

### 第 7 步：继续执行模式1的流程

使用用户选择的标签，继续执行[模式1的第3步](#第-3-步提取正文内容)及后续步骤。

---

## 模式3：剪贴板工作流程

**触发条件**：用户未提供任何参数（现有功能）

此部分为现有的剪贴板转 Markdown 流程，保持不变。



### 必须做到
1. **内容一字不差**：所有正文文字必须完整保留
2. **结构清晰**：标题层级、列表嵌套关系正确
3. **格式规范**：符合标准 Markdown 语法
4. **可读性好**：输出的 Markdown 易于阅读和编辑

### 避免的错误
- ❌ 删除或修改任何正文内容
- ❌ 遗漏段落或章节
- ❌ 改变原文的表述方式
- ❌ 错误的标题层级
- ❌ 破坏列表或表格结构
- ❌ 遗漏代码块或特殊元素

## 特殊情况处理

### 嵌套结构
- 嵌套列表保持正确的缩进（2 空格/层级）
- 嵌套引用（`> > `）
- 表格中的列表或格式

### 特殊字符
- 正确转义 Markdown 特殊字符：“\”、“*”、“_”、“[”、“]”、“(”、“)”、“#”“`“ ”“`”、“>”、“-”、“+”、“.” 、“!”
- 使用反斜杠转义：“\*”、“\_” 等

### 空白和格式
- 保留段落间的空行
- 代码块前后的空行
- 不添加多余的空行（最多保留 2 个连续空行）

### 无关内容
- 跳过导航菜单（`<nav>`）
- 跳过页眉页脚（`<header>`, `<footer>`）
- 跳过侧边栏（`<aside>`）
- 跳过脚本和样式（`<script>`, `<style>`）

## 示例

### 输入 HTML
```html
<article>
  <h1>Python 编程入门</h1>
  <p>Python 是一门简单易学的编程语言。</p>

  <h2>基本语法</h2>
  <p>Python 的语法清晰简洁：</p>
  <pre><code class="language-python">print("Hello, World!")
</code></pre>

  <h2>特点</h2>
  <ul>
    <li>简单易学</li>
    <li>功能强大</li>
    <li>应用广泛</li>
  </ul>
</article>
```

### 输出 Markdown
````markdown
# Python 编程入门

Python 是一门简单易学的编程语言。

## 基本语法

Python 的语法清晰简洁：

```python
print("Hello, World!")
```

## 特点

- 简单易学
- 功能强大
- 应用广泛
````

注意：所有文字内容都完整保留，结构清晰，格式规范。

---

## 正文标签库管理

### 标签规则库位置

`${SKILL_DIR}/content-tag-rules.json`

### 规则库结构

```json
{
  "version": "1.0.0",
  "last_updated": "2026-02-24",
  "rules": [
    {
      "domain": "mp.weixin.qq.com",
      "domain_pattern": "*",
      "selector": "#img-content",
      "description": "微信公众号文章",
      "priority": 100,
      "verified": true
    }
  ]
}
```

**字段说明**：
- `domain`: 网站域名（如 `mp.weixin.qq.com`）
- `domain_pattern`: 域名匹配模式（`*` 表示通配符）
- `selector`: CSS 选择器（如 `#img-content`, `.content`, `article`）
- `description`: 规则描述
- `priority`: 优先级（数值越大越优先，预置规则通常 85-100，用户规则 95）
- `verified`: 是否经过验证（`true` 表示人工确认过）

### 域名匹配逻辑

当用户提供 URL 时，系统按以下顺序查找标签规则：

1. **精确匹配**：查找 `domain` 字段与 URL 域名完全一致的规则
2. **通配符匹配**：查找 `domain` 为 `*` 的通用规则
3. **优先级排序**：如果有多个规则匹配，选择 `priority` 最高的
4. **返回选择器**：使用选中规则的 `selector` 字段

### 手动添加规则

用户可以直接编辑 `content-tag-rules.json` 添加新规则：

1. 打开文件：`${SKILL_DIR}/content-tag-rules.json`
2. 在 `rules` 数组中添加新规则对象
3. 调整字段值：
   - 修改 `domain` 为目标网站域名
   - 修改 `selector` 为正确的 CSS 选择器
   - 修改 `description` 为规则描述
   - 设置 `priority`（建议 85-100）
   - 设置 `verified: true`
4. 保存文件

**示例**：
```json
{
  "domain": "example.com",
  "domain_pattern": "*",
  "selector": "article",
  "description": "Example.com 博客文章",
  "priority": 90,
  "verified": true
}
```

### 常用 CSS 选择器示例

- **ID 选择器**：`#content`, `#main`, `#article`
- **类选择器**：`.content`, `.post-content`, `.article-body`
- **标签选择器**：`article`, `main`, `section`
- **组合选择器**：`article.post`, `div#main-content`
- **属性选择器**：`[role="main"]`, `[itemprop="articleBody"]`

### 预置网站列表

当前预置的网站规则：

| 域名 | 选择器 | 描述 |
|------|--------|------|
| mp.weixin.qq.com | `#img-content` | 微信公众号文章 |
| zhihu.com | `.Post-RichText` | 知乎回答 |
| zhuanlan.zhihu.com | `.Post-RichText` | 知乎专栏文章 |
| juejin.cn | `article` | 掘金文章 |
| csdn.net | `#content_views` | CSDN 博客 |
| segmentfault.com | `article` | SegmentFault 文章 |
| jianshu.com | `article` | 简书文章 |

### 通用规则

当找不到特定域名规则时，系统会尝试以下通用规则（按优先级排序）：

1. `article` (优先级 50) - HTML5 语义化标签
2. `main` (优先级 45) - 主内容区域
3. `.article-content` (优先级 43) - 文章内容类
4. `.post-content` (优先级 42) - 帖子内容类
5. `.content` (优先级 40) - 通用内容类
6. `#content` (优先级 40) - 通用内容 ID

