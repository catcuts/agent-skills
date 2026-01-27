# 技能编写参考

本文档提供 SKILL.md 的详细编写指南，包括 YAML frontmatter 字段详解、任务指令编写模式和示例对比。

---

## 📖 SKILL.md 结构

### 完整结构

```markdown
---
name: skill-name
description: 技能功能描述，一句话说明技能的作用
allowed-tools: Bash, Read, Write
version: 1.0.0
metadata:
  internal: false  # 可选：设为 true 隐藏该技能
---

# 技能名称

## 任务指令

当被调用时，执行以下步骤：

1. **步骤一**
    - 使用 `工具名` 工具执行操作
    - 说明注意事项

2. **步骤二**
    - 继续执行操作
    - 处理结果

## 附加说明

（可选）技能的补充说明、注意事项等
```

### 结构说明

| 部分             | 说明                               | 必需 |
| ---------------- | ---------------------------------- | ---- |
| YAML Frontmatter | 技能元数据（name, description 等） | ✅   |
| 技能标题         | Markdown 标题（# 技能名称）        | 推荐 |
| 任务指令         | 技能的主要逻辑和步骤               | ✅   |
| 附加说明         | 补充说明、注意事项、使用建议       | 可选 |

### metadata 字段（可选）

从 v1.1.2 开始，SKILL.md 支持可选的 metadata 字段：

```yaml
metadata:
  internal: false  # 设为 true 隐藏该技能
```

字段说明：
- `internal`: 布尔值，设为 true 时隐藏该技能（默认为 false）
- 用于内部技能或开发中的技能

---

## 🔧 YAML Frontmatter 字段详解

### name（必需）

技能名称，必须小写，使用连字符分隔。

#### 格式

```yaml
name: my-skill
```

#### 命名规则

- ✅ **小写字母**: `hello-world`
- ✅ **连字符分隔**: `code-generator`, `api-helper`
- ✅ **描述性**: `session-manager`, `file-organizer`
- ✅ **简洁**: 不超过 64 个字符
- ❌ **避免**: 大写字母、下划线、特殊字符
- ❌ **避免**: 过于通用的名称（如 `helper`, `tool`）

#### 示例

| 好                | 不好             |
| ----------------- | ---------------- |
| `hello-world`     | `HelloWorld`     |
| `code-generator`  | `code_generator` |
| `api-helper`      | `helper`         |
| `session-manager` | `sessionManager` |

### description（必需）

技能功能的简短描述，清晰说明技能的作用。

#### 格式

```yaml
description: 跨会话工作交接工具。支持"归档当前进度"和"恢复历史进度"两个模式。
```

#### 编写要点

- **一句话概括**: 尽量用一句话说明功能
- **突出用途**: 说明技能解决什么问题
- **包含关键词**: 便于搜索和理解
- **避免技术术语**: 除非是目标用户熟悉的术语

#### 示例

| 好                                                                 | 不好         |
| ------------------------------------------------------------------ | ------------ |
| `跨会话工作交接工具。支持"归档当前进度"和"恢复历史进度"两个模式。` | `一个工具`   |
| `简单的 Hello World 示例技能，用于验证技能安装是否成功。`          | `测试技能`   |
| `生成 React 组件模板的代码生成器`                                  | `代码生成器` |

### allowed-tools（必需）

技能可以使用的 Claude Code 工具列表，逗号分隔。

#### 格式

```yaml
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
```

#### 可用工具

| 工具              | 说明                   | 使用场景                     |
| ----------------- | ---------------------- | ---------------------------- |
| `Bash`            | 执行命令行命令         | 运行测试、执行脚本、文件操作 |
| `Read`            | 读取文件内容           | 读取配置、分析代码           |
| `Write`           | 写入文件内容           | 创建文件、生成代码           |
| `Edit`            | 编辑文件（字符串替换） | 修改配置、更新代码           |
| `Glob`            | 文件模式匹配           | 查找文件、遍历目录           |
| `Grep`            | 内容搜索               | 搜索代码、查找文本           |
| `AskUserQuestion` | 向用户提问             | 获取输入、确认选择           |
| `TodoWrite`       | 任务管理               | 创建任务、跟踪进度           |

#### 选择原则

- **最小化原则**: 只声明必需的工具
- **明确性**: 清楚每个工具的用途
- **安全性**: 避免声明危险操作的工具

#### 示例

| 技能类型 | allowed-tools                                                     |
| -------- | ----------------------------------------------------------------- |
| 文件操作 | `Read, Write, Edit`                                               |
| 代码分析 | `Read, Grep, Glob`                                                |
| 任务管理 | `TodoWrite, AskUserQuestion`                                      |
| 系统操作 | `Bash, Read, Write`                                               |
| 完整功能 | `Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion, TodoWrite` |

### version（推荐）

技能版本号，与 package.json 中的 version 一致。

#### 格式

```yaml
version: 1.0.0
```

#### 版本规则

遵循语义化版本规范（Semantic Versioning）：

- **MAJOR.MINOR.PATCH**: 如 `1.0.0`
- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向下兼容的功能性新增
- **PATCH**: 向下兼容的问题修正

#### 示例

| 版本变化          | 类型  | 说明             |
| ----------------- | ----- | ---------------- |
| `1.0.0` → `2.0.0` | MAJOR | 重构任务指令结构 |
| `1.0.0` → `1.1.0` | MINOR | 新增功能         |
| `1.0.0` → `1.0.1` | PATCH | 修复 bug         |

---

## 📝 任务指令编写模式

### 模式一：顺序执行

最简单的模式，按顺序执行步骤。

#### 示例

```markdown
## 任务指令

当被调用时，执行以下步骤：

1. **读取文件**
   使用 `Read` 工具读取 `package.json` 文件

2. **分析依赖**
   检查 dependencies 和 devDependencies 字段

3. **输出结果**
   显示以下信息：
```

✓ 分析完成

- 文件数量: 10
- 代码行数: 500

```

```

#### 适用场景

- 简单的线性任务
- 无需用户交互
- 步骤之间无依赖关系

### 模式二：条件分支

根据用户意图或条件执行不同流程。

#### 示例

```markdown
## 任务指令

当被调用时，判断用户意图：

### 模式 A：导出

如果用户说"导出"或"保存"：

1. **收集信息**
   使用 `Read` 工具读取当前状态文件

2. **生成存档**
   使用 `Write` 工具创建存档文件

### 模式 B：导入

如果用户说"导入"或"恢复"：

1. **列出存档**
   使用 `Bash` 工具执行 `ls -d .archive/*/`

2. **选择存档**
   询问用户选择要恢复的存档
```

#### 适用场景

- 多种工作模式
- 需要用户选择
- 不同场景不同处理

### 模式三：交互式

与用户交互，根据输入动态调整。

#### 示例

```markdown
## 任务指令

当被调用时，执行以下步骤：

1. **列出选项**
   显示可用的配置模板：
    - React 组件
    - Vue 组件
    - Node.js 模块

2. **询问选择**
   使用 `AskUserQuestion` 工具询问用户选择模板类型

3. **生成代码**
   根据用户选择，使用 `Write` 工具生成相应的代码模板

4. **确认完成**
   显示生成的文件路径和下一步建议
```

#### 适用场景

- 需要用户输入
- 生成自定义内容
- 动态配置

### 模式四：任务管理

结合 TodoWrite 工具，跟踪任务进度。

#### 示例

```markdown
## 任务指令

当被调用时，执行以下步骤：

1. **创建任务列表**
   使用 `TodoWrite` 工具创建任务列表：
    - 分析项目结构
    - 生成文档
    - 创建示例代码

2. **执行任务**
   按顺序执行任务，每个任务完成后标记为完成

3. **输出结果**
   显示所有完成的任务和剩余任务
```

#### 适用场景

- 多步骤复杂任务
- 需要跟踪进度
- 长时间运行的任务

---

## 🎨 编写最佳实践

### 1. 步骤清晰

#### ✅ 好的写法

```markdown
1. **读取文件**
   使用 `Read` 工具读取 `package.json` 文件

2. **分析依赖**
   检查 dependencies 和 devDependencies 字段
```

#### ❌ 不好的写法

```markdown
1. 读取文件并分析依赖
```

### 2. 明确工具

#### ✅ 好的写法

```markdown
使用 `Bash` 工具执行 `npm test` 命令
使用 `Read` 工具读取 `src/index.js` 文件
```

#### ❌ 不好的写法

```markdown
执行测试命令
读取文件
```

### 3. 提供示例

#### ✅ 好的写法

```markdown
3. **输出结果**
   显示以下信息：
```

✓ 分析完成

- 文件数量: 10
- 代码行数: 500

```

```

#### ❌ 不好的写法

```markdown
3. 输出结果
```

### 4. 友好提示

#### ✅ 好的写法

```markdown
如果文件不存在，提示用户：
"未找到配置文件，是否创建默认配置？"
```

#### ❌ 不好的写法

```markdown
文件不存在时退出
```

### 5. 错误处理

#### ✅ 好的写法

```markdown
如果执行失败，显示错误信息并提示解决方案：
"✗ 安装失败: package.json 格式错误"
"建议: 运行 `npm init` 创建 package.json"
```

#### ❌ 不好的写法

```markdown
如果失败则退出
```

---

## 📊 示例对比

### 简单技能：hello-world

#### YAML Frontmatter

```yaml
---
name: hello-world
description: 简单的 Hello World 示例技能，用于验证技能安装是否成功。
allowed-tools: Bash
version: 1.0.0
---
```

#### 任务指令

```markdown
## 任务指令

当被调用时，执行以下步骤：

1. **显示欢迎信息**
```

✨ Hello World Skill 已成功安装！
这是你的第一个 Claude Code 技能。

```

2. **收集环境信息**
使用 `Bash` 工具执行以下命令：
- `node --version` - 显示 Node.js 版本
- `npm --version` - 显示 npm 版本

3. **显示下一步建议**
```

🎉 恭喜！你的技能系统运行正常。

```

```

#### 特点

- ✅ 简单明了
- ✅ 单一用途
- ✅ 易于理解
- ✅ 工具少（只有 Bash）

### 复杂技能：handover

#### YAML Frontmatter

```yaml
---
name: handover
description: 跨会话工作交接工具。支持"归档当前进度"和"恢复历史进度"两个模式。
allowed-tools: Read, Write, Bash
version: 1.0.0
---
```

#### 任务指令

```markdown
## 任务指令

当你被调用时，请判断用户的意图：是"交接出去"还是"接手回来"。

## 模式 1：导出 (Export)

如果用户说"交接"或类似含义：

1. **深度汇总**
   分析当前会话，提取任务目标、已改代码、待办事项和核心逻辑

2. **创建目录**
   在 `.handover/` 下创建以"工作简述"命名的文件夹

3. **写入存档**
   使用 `Write` 工具生成 `HANDOVER.md`

4. **结束引导**
   输出以下文字：
```

✨ 存档已就绪 ✅
现在你可以手动执行 `/clear` 释放内存

```

## 模式 2：恢复 (Resume)

如果用户输入"交接：接手"：

1. **列出存档**
使用 `Bash` 工具执行 `ls -d .handover/*/`

2. **交互选择**
以数字列表形式展示所有存档
询问用户："请选择要接手的序号"

3. **读取并初始化**
使用 `Read` 工具读取对应的 `HANDOVER.md`
显示："✨ 读取成功。我已定位到存档的状态"
```

#### 特点

- ✅ 多模式（导出/恢复）
- ✅ 用户交互
- ✅ 文件操作（Read, Write, Bash）
- ✅ 复杂逻辑
- ✅ 友好的提示

---

## 🔍 技能类型参考

### 类型一：工具类技能

提供特定的工具功能。

#### 示例

- **代码格式化**: 格式化代码文件
- **文件转换**: 转换文件格式（如 Markdown → HTML）
- **日志分析**: 分析日志文件

#### YAML Frontmatter

```yaml
---
name: code-formatter
description: 代码格式化工具，支持 JavaScript、TypeScript、CSS 等多种语言。
allowed-tools: Read, Write, Bash, Edit
version: 1.0.0
---
```

### 类型二：信息类技能

提供项目信息和环境信息。

#### 示例

- **项目信息**: 显示项目结构、依赖、配置
- **环境检查**: 检查开发环境配置
- **文档生成**: 生成项目文档

#### YAML Frontmatter

```yaml
---
name: project-info
description: 显示项目信息，包括依赖、配置、文件结构等。
allowed-tools: Read, Bash, Glob, Grep
version: 1.0.0
---
```

### 类型三：生成类技能

根据模板或输入生成代码或文档。

#### 示例

- **组件生成**: 生成 React/Vue 组件
- **API 生成**: 生成 API 客户端代码
- **模板生成**: 生成项目模板

#### YAML Frontmatter

```yaml
---
name: component-generator
description: React 组件生成器，支持函数组件和类组件。
allowed-tools: Write, AskUserQuestion, Read
version: 1.0.0
---
```

### 类型四：管理类技能

管理项目任务、配置、状态等。

#### 示例

- **任务管理**: 创建和跟踪任务
- **配置管理**: 管理项目配置
- **版本管理**: 管理版本号和 CHANGELOG

#### YAML Frontmatter

```yaml
---
name: task-manager
description: 项目任务管理工具，创建和跟踪开发任务。
allowed-tools: TodoWrite, AskUserQuestion, Write, Read
version: 1.0.0
---
```

### 类型五：辅助类技能

辅助开发流程，提供便捷功能。

#### 示例

- **代码审查**: 辅助代码审查
- **测试辅助**: 辅助测试编写
- **调试辅助**: 辅助调试

#### YAML Frontmatter

```yaml
---
name: test-helper
description: 测试辅助工具，生成测试用例和测试数据。
allowed-tools: Read, Write, Grep, Bash
version: 1.0.0
---
```

---

## ✅ 编写检查清单

### YAML Frontmatter

- [ ] name 字段存在且格式正确（小写、连字符）
- [ ] description 字段存在且清晰描述功能
- [ ] allowed-tools 字段存在且列出所有需要的工具
- [ ] version 字段存在且与 package.json 一致

### 任务指令

- [ ] 步骤清晰，编号列表
- [ ] 明确指定使用的工具
- [ ] 提供示例输出
- [ ] 包含友好的提示信息
- [ ] 包含错误处理说明

### 整体结构

- [ ] Markdown 格式正确
- [ ] 标题层级清晰
- [ ] 代码块格式正确
- [ ] 无语法错误

---

## 🔗 相关资源

- [01-project-structure.md](./01-project-structure.md) - 项目结构规范
- [02-development-workflow.md](./02-development-workflow.md) - 开发流程规范
- [开发模板](../../ref/agent-skill-npm-boilerplate@<your-org>/) - SKILL.md 模板

---

**开始编写**: 使用 [开发模板](../../ref/agent-skill-npm-boilerplate@<your-org>/) 创建你的 SKILL.md
