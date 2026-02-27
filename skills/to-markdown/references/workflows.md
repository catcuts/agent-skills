# to-markdown 工作流程详细说明

本文档包含所有模式的详细工作流程步骤。

## 目录

- [模式 1：URL带标签工作流程](#模式-1：url带标签工作流程)
- [模式 2：URL不带标签工作流程](#模式-2：url不带工作流程)
- [模式 3：剪贴板工作流程](#模式-3：剪贴板工作流程)

---

## 模式 1：URL带标签工作流程

### 触发条件

用户提供：
- `--html_url=<URL>`
- `--html_main_content_tag=<CSS选择器>`

### 工作流程概览

```
1. 检查 Python 依赖
2. 下载 HTML（三层降级：urllib → agent-browser → Playwright）
3. 使用 CSS 选择器提取内容 ←【关键步骤】
4. 清理 HTML
5. AI 转换为 Markdown
6. 保存并验证
7. 清理临时文件
```

### 详细步骤

#### 步骤 1：检查 Python 依赖

```bash
python -c "import bs4; import pyperclip; print('OK')"
```

如果失败，安装依赖：
```bash
pip install beautifulsoup4 pyperclip
```

#### 步骤 2：下载 HTML（三层降级架构）

##### 2.1 第 1 层 - Python urllib

```bash
python "${SKILL_DIR}/utils/download_html_simple.py" "<URL>"
```

**检查结果**：

**成功**（退出码 0）：
- stdout: 临时文件路径
- stderr: `METHOD:urllib`
- → 继续步骤 3

**建议降级**（退出码 10 或 11）：
- stderr: `SUGGEST_FALLBACK:agent-browser`
- → 继续 2.2

##### 2.2 第 2 层 - agent-browser

如果 Python urllib 失败：

**工作流程**：

1. **检查并设置 Cookie（如果环境变量存在）**：
   ```bash
   # 设置脚本会自动从 URL 提取域名并检查对应的环境变量
   # 例如：https://x.com/test → 检查 COOKIE_x_com
   # 例如：https://twitter.com/test → 检查 COOKIE_twitter_com
   # 例如：https://linkedin.com/in/test → 检查 COOKIE_linkedin_com

   python utils/setup_agent_browser_cookies.py "<目标URL>"
   ```

   `setup_agent_browser_cookies.py` 脚本会：
   - 自动从 URL 提取域名
   - 动态生成环境变量名（格式：`COOKIE_<域名>`，`.` 替换为 `_`）
   - 检查环境变量是否存在
   - 如果存在，解析并设置到 agent-browser
   - 输出设置结果

2. **打开页面**：
   ```bash
   agent-browser open "<URL>"
   ```

3. **等待加载**：
   ```bash
   agent-browser wait --load 3000
   ```

4. **获取完整 HTML**：
   ```bash
   agent-browser get html body > <temp_file>
   ```

5. **关闭浏览器**：
   ```bash
   agent-browser close
   ```

**成功**：→ 继续步骤 3
**失败**：→ 继续 2.3

##### 2.3 第 3 层 - Playwright

如果 agent-browser 也失败：

**检查安装**：
```bash
cd "${SKILL_DIR}/utils"
test -d node_modules/playwright && echo "Installed" || echo "Not installed"
```

**如果未安装**：
```bash
cd "${SKILL_DIR}/utils"
npm install
npx playwright install chromium
```

**使用 Playwright 下载**：
```bash
cd "${SKILL_DIR}/utils"
node download_html_playwright.mjs "<URL>"
```

**成功**：→ 继续步骤 3
**失败**：→ 报告错误，建议剪贴板模式

#### 步骤 3：使用 CSS 选择器提取内容

如果用户提供了 `html_main_content_tag`，那么执行提取：

```bash
python "${SKILL_DIR}/utils/extract_content.py" "<下载的HTML文件>" "<CSS选择器>"
```

输出：提取后的 HTML 文件路径

如果未提供 `html_main_content_tag`，那么跳过此步骤，直接使用下载的完整 HTML

#### 步骤 4：清理 HTML

```bash
python -c "
from bs4 import BeautifulSoup
import sys

with open('<提取后的HTML文件>', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 保留的属性
KEEP_ATTRS = {
    'a': ['href', 'title'],
    'img': ['src', 'data-src', 'alt', 'title'],
    'code': ['class'],
    'pre': ['class'],
}

# 移除的标签
REMOVE_TAGS = ['script', 'style', 'nav', 'footer', 'header', 'aside']

for tag in soup.find_all(REMOVE_TAGS):
    tag.decompose()

for tag in soup.find_all(True):
    if tag.name in KEEP_ATTRS:
        tag.attrs = {k: v for k, v in tag.attrs.items() if k in KEEP_ATTRS[tag.name]}
    else:
        tag.attrs = {}

print(soup.prettify())
" > "<清理后的HTML文件>"
```

#### 步骤 5：AI 转换为 Markdown

**读取 HTML 文件**，智能转换为 Markdown：

**转换规则**：
1. 标题：`<h1>` → `# `, `<h2>` → `## `
2. 段落：`<p>` → 文字 + 空行
3. 链接：`<a href="...">文本</a>` → `[文本](...)`
4. 图片：`<img src="...">` → `![](...)`
5. 列表：`<ul>/<ol>` → `- `/ `1. `
6. 代码块：`<pre><code>` → ```` ``` ````
7. 表格：Markdown 表格格式
8. 引用：`<blockquote>` → `> `

#### 步骤 6：保存并验证

保存 Markdown 文件并验证：
- 内容完整性
- 格式正确性
- 链接有效性

#### 步骤 7：清理临时文件

删除所有临时文件。

---

## 模式 2：URL不带标签工作流程

### 触发条件

用户提供：
- `--html_url=<URL>`
- 未提供 `--html_main_content_tag`

### 工作流程

#### 步骤 1-2：同模式 1

下载 HTML（使用三层降级架构）

#### 步骤 3：智能分析标签

```bash
python "${SKILL_DIR}/utils/analyze_tags.py" "<临时文件路径>"
```

**输出**：候选标签列表（按评分排序）

#### 步骤 4：展示候选标签

向用户展示分析结果：

```
智能分析完成，找到以下可能的正文标签：

1. #img-content (评分: 95)
2. article (评分: 50)
3. .content (评分: 40)

请选择要使用的标签:
```

#### 步骤 5：用户选择

等待用户输入：
- 数字：使用对应标签
- 自定义选择器
- Enter：使用推荐标签

#### 步骤 6-10：同模式 1

提取、清理、转换、保存、清理。

---

## 模式 3：剪贴板工作流程

### 触发条件

用户未提供任何参数

### 工作流程

#### 步骤 1：获取剪贴板内容

```bash
python "${SKILL_DIR}/utils/save_clipboard.py"
```

**输出**：临时文件路径

#### 步骤 2-7：同模式 1

清理、转换、保存、清理（无需提取）。

---

## 关键注意事项

### 关于 `html_main_content_tag`

**必须使用**：
- ✅ 用户提供了 `--html_main_content_tag`
- ✅ 使用 agent-browser 下载后
- ✅ 使用 Playwright 下载后

**不需要**：
- ❌ 用户未提供 `--html_main_content_tag`
- ❌ 使用剪贴板模式

### 下载层和提取的关系

```
下载层（urllib / agent-browser / Playwright）
  ↓
得到完整 HTML 文件
  ↓
如果提供了 html_main_content_tag？
  ├─ 是 → 使用 extract_content.py 提取
  └─ 否 → 直接使用完整 HTML
  ↓
清理 HTML
  ↓
转换为 Markdown
```

### 常见错误

**错误 1**：下载后直接转换，跳过提取
- ❌ 直接使用下载的完整 HTML 转换
- ✅ 先用 `extract_content.py` 提取指定内容

**错误 2**：agent-browser 获取后未提取
- ❌ `agent-browser get html body` → 直接转换
- ✅ `agent-browser get html body` → `extract_content.py` → 转换

**错误 3**：Playwright 下载后未提取
- ❌ Playwright 下载 → 直接转换
- ✅ Playwright 下载 → `extract_content.py` → 转换
