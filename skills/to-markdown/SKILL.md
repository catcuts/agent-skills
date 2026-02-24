---
name: clipboard-to-markdown
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

## 转换质量标准

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
