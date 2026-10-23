# 开发流程规范

本文档定义了 Claude Code 技能的标准开发流程，从项目初始化到本地调试的完整步骤。

---

## 🚀 开发流程概览

```
1. 项目初始化
   ↓
2. 命名和配置
   ↓
3. 编写 SKILL.md
   ↓
4. 本地测试和调试
   ↓
5. 代码提交
```

---

## 1️⃣ 项目初始化

### 方式一：使用开发模板（推荐）

```bash
# 1. 复制模板
cp -r ref/agent-skill-npm-boilerplate@<your-org> my-skill
cd my-skill

# 2. 修改包名和描述
# 编辑 package.json，修改以下字段：
# - name: "@your-username/my-skill"
# - description: "技能功能描述"
# - author: "your-name"
# - repository.url: "https://github.com/your-username/your-repo"

# 3. 修改 SKILL.md
# 编辑 SKILL.md，定义技能功能和任务指令

# 4. 本地测试
npm run install:local
```

### 方式二：从零创建

```bash
# 1. 创建项目目录
mkdir my-skill
cd my-skill

# 2. 初始化 npm 项目
npm init -y

# 3. 创建目录结构
mkdir scripts

# 4. 创建必需文件
touch SKILL.md README.md LICENSE
touch scripts/install-skill.js scripts/uninstall-skill.js

# 5. 安装开发依赖
npm install --save-optional skills@^1.7.4

# 6. 编辑 package.json
# 参考"项目结构规范"文档配置所有必需字段
```

---

## 2️⃣ 命名和配置

### 包名规范

#### 格式

```
@scope/skill-name
```

#### 示例

| 用户名      | 技能名称         | 包名                       |
| ----------- | ---------------- | -------------------------- |
| `<your-name>`   | `hello-world`    | `@<your-org>/hello-world`   |
| `john-doe`  | `code-generator` | `@john-doe/code-generator` |
| `acme-corp` | `api-helper`     | `@acme-corp/api-helper`    |

#### 技能名称规则

- ✅ **小写字母**: `hello-world`
- ✅ **连字符分隔**: `code-generator`, `api-helper`
- ✅ **描述性**: `session-manager`, `file-organizer`
- ❌ **避免**: 大写字母、下划线、特殊字符
- ❌ **避免**: 过于通用的名称（如 `helper`, `tool`）

### package.json 配置

#### 最小化配置

```json
{
    "name": "@<your-org>/my-skill",
    "version": "1.0.0",
    "description": "技能功能描述",
    "main": "index.js",
    "scripts": {
        "postinstall": "node scripts/install-skill.js",
        "preuninstall": "node scripts/uninstall-skill.js",
        "test": "node scripts/install-skill.js --dry-run",
        "install:global": "node scripts/install-skill.js --global",
        "install:local": "node scripts/install-skill.js --local"
    },
    "files": ["SKILL.md", "scripts/"],
    "keywords": ["claude-code", "skill", "my-skill"],
    "author": "<your-name>",
    "license": "MIT",
    "engines": {
        "node": ">=18.0.0"
    }
}
```

#### 完整配置（推荐）

```json
{
    "name": "@<your-org>/my-skill",
    "version": "1.0.0",
    "description": "技能功能描述",
    "main": "index.js",
    "scripts": {
        "postinstall": "node scripts/install-skill.js",
        "preuninstall": "node scripts/uninstall-skill.js",
        "test": "node scripts/install-skill.js --dry-run",
        "install:global": "node scripts/install-skill.js --global",
        "install:local": "node scripts/install-skill.js --local",
        "lint": "echo 'Add your linting commands here'"
    },
    "files": ["SKILL.md", "scripts/"],
    "keywords": ["claude-code", "skill", "my-skill", "category-specific"],
    "author": "<your-name>",
    "license": "MIT",
    "repository": {
        "type": "git",
        "url": "git+https://github.com/<your-username>/<your-repo>.git",
        "directory": "skills/my-skill"
    },
    "bugs": {
        "url": "https://github.com/<your-username>/<your-repo>/issues"
    },
    "homepage": "https://github.com/<your-username>/<your-repo>#readme",
    "engines": {
        "node": ">=18.0.0"
    }
}
```

---

## 3️⃣ 编写 SKILL.md

### YAML Frontmatter

#### 基本格式

```yaml
---
name: my-skill
description: 技能功能描述，一句话说明技能的作用
allowed-tools: Bash, Read, Write
version: 1.0.0
---
```

#### 字段说明

| 字段            | 说明                                             | 示例                            | 必需 |
| --------------- | ------------------------------------------------ | ------------------------------- | ---- |
| `name`          | 技能名称（与 package.json 中的 skill-name 一致） | `hello-world`                   | ✅   |
| `description`   | 技能功能描述（清晰、简洁）                       | `"简单的 Hello World 示例技能"` | ✅   |
| `allowed-tools` | 允许使用的工具列表（逗号分隔）                   | `Bash, Read, Write`             | ✅   |
| `version`       | 技能版本号（与 package.json version 一致）       | `1.0.0`                         | 推荐 |

#### allowed-tools 可用值

Claude Code 支持的主要工具：

- `Bash` - 执行命令行命令
- `Read` - 读取文件内容
- `Write` - 写入文件内容
- `Edit` - 编辑文件（字符串替换）
- `Glob` - 文件模式匹配
- `Grep` - 内容搜索
- `AskUserQuestion` - 向用户提问
- `TodoWrite` - 任务管理
- 以及其他 Claude Code 内置工具

### 任务指令编写

#### 结构模板

```markdown
# 技能名称

## 任务指令

当被调用时，执行以下步骤：

1. **步骤一：步骤标题**
    - 使用 `工具名` 工具执行操作
    - 说明注意事项

2. **步骤二：步骤标题**
    - 继续执行操作
    - 处理结果

3. **输出结果**
```

✓ 任务完成

```

## 附加说明

（可选）技能的补充说明、注意事项等
```

#### 编写最佳实践

##### 1. 步骤清晰

✅ **好的写法**：

```markdown
1. **读取文件**
   使用 `Read` 工具读取 `package.json` 文件

2. **分析依赖**
   检查 dependencies 和 devDependencies 字段
```

❌ **不好的写法**：

```markdown
1. 读取文件并分析依赖
```

##### 2. 明确工具

✅ **好的写法**：

```markdown
使用 `Bash` 工具执行 `npm test` 命令
使用 `Read` 工具读取 `src/index.js` 文件
```

❌ **不好的写法**：

```markdown
执行测试命令
读取文件
```

##### 3. 提供示例

✅ **好的写法**：

```markdown
3. **输出结果**
   显示以下信息：
```

✓ 分析完成

- 文件数量: 10
- 代码行数: 500

```

```

❌ **不好的写法**：

```markdown
3. 输出结果
```

##### 4. 友好提示

✅ **好的写法**：

```markdown
如果文件不存在，提示用户：
"未找到配置文件，是否创建默认配置？"
```

❌ **不好的写法**：

```markdown
文件不存在时退出
```

### 复杂技能示例：条件分支

```markdown
## 任务指令

当被调用时，判断用户意图：

### 模式 A：导出

如果用户说"导出"或"保存"：

1. **收集信息**
   使用 `Read` 工具读取当前状态文件

2. **生成存档**
   使用 `Write` 工具创建存档文件

3. **显示结果**
```

✓ 存档已创建
路径: .archive/backup.md

```

### 模式 B：导入

如果用户说"导入"或"恢复"：

1. **列出存档**
使用 `Bash` 工具执行 `ls -d .archive/*/`

2. **选择存档**
询问用户选择要恢复的存档

3. **恢复状态**
读取并显示存档内容
```

---

## 4️⃣ 本地测试和调试

### 测试安装脚本

#### 测试模式（不实际安装）

```bash
# 方式一：使用 npm test
npm test

# 方式二：直接运行脚本
node scripts/install-skill.js --dry-run
```

**预期输出**：

```
✓ 开始安装 My Skill...
✓ 安装范围: 全局(GLOBAL)

[DRY-RUN] 将要执行的命令:
  npx skills "E:\my-skill" -g -y

✓ 测试通过 - 实际安装请运行: npm run install:global 或 npm run install:local
```

### 项目级安装测试

```bash
# 安装到当前项目
npm run install:local

# 验证安装
ls .claude/skills/my-skill/SKILL.md
```

### 全局安装测试

```bash
# 全局安装
npm run install:global

# 验证安装
ls ~/.claude/skills/my-skill/SKILL.md
```

### 功能测试

#### 在 Claude Code 中测试

1. **启动 Claude Code**

    ```bash
    claude
    ```

2. **列出已安装技能**

    ```
    /skills
    ```

3. **调用技能**

    ```
    my-skill
    ```

4. **观察输出**
    - 检查是否按预期执行
    - 验证输出格式是否正确
    - 确认错误处理是否正常

#### 调试技巧

**查看安装路径**：

```bash
# 全局安装路径
ls ~/.claude/skills/

# 项目级安装路径
ls .claude/skills/
```

**查看 SKILL.md 内容**：

```bash
# 确认文件已正确复制
cat ~/.claude/skills/my-skill/SKILL.md
```

**重新安装**：

```bash
# 先卸载
npm run uninstall:local

# 再安装
npm run install:local
```

---

## 5️⃣ 代码提交

### Git 提交规范

#### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

| Type       | 说明          | 示例                     |
| ---------- | ------------- | ------------------------ |
| `feat`     | 新功能        | `feat: 添加代码生成功能` |
| `fix`      | 修复 bug      | `fix: 修复安装路径错误`  |
| `docs`     | 文档更新      | `docs: 更新 README.md`   |
| `style`    | 代码格式调整  | `style: 统一缩进格式`    |
| `refactor` | 重构代码      | `refactor: 优化安装脚本` |
| `test`     | 测试相关      | `test: 添加单元测试`     |
| `chore`    | 构建/工具相关 | `chore: 更新依赖版本`    |

#### 示例提交

```bash
# 简单提交
git commit -m "feat: 添加代码生成技能"

# 详细提交
git commit -m "feat(generator): 添加代码生成功能

- 支持生成 React 组件模板
- 支持生成 API 客户端代码
- 添加自定义模板配置

Closes #123"
```

### 提交前检查清单

- [ ] 所有文件已保存
- [ ] 代码已通过测试
- [ ] package.json 版本号已更新
- [ ] README.md 文档已同步更新
- [ ] SKILL.md 任务指令已验证
- [ ] 安装脚本已测试

---

## 🔧 开发工具推荐

### IDE 推荐

- **VS Code**: 推荐，插件生态丰富
- **WebStorm**: JetBrains 出品，强大的 Node.js 支持

### VS Code 插件

- **YAML**: YAML frontmatter 语法高亮
- **Markdown All in One**: Markdown 编辑增强
- **ESLint**: 代码质量检查

### 命令行工具

- **npx**: 运行 npm 包（无需安装）
- **npm-check-updates**: 检查依赖更新
- **npm-run-all**: 并行运行 npm scripts

---

## 📋 开发检查清单

### 项目初始化

- [ ] 使用模板或从零创建项目
- [ ] 配置 package.json 所有必需字段
- [ ] 创建 scripts 目录和脚本文件

### 配置和命名

- [ ] 包名使用 npm scope 格式（`@username/skill-name`）
- [ ] 技能名称符合命名规范（小写、连字符）
- [ ] 版本号遵循语义化版本规范
- [ ] keywords 包含相关搜索词

### SKILL.md 编写

- [ ] YAML frontmatter 格式正确
- [ ] name 字段与技能名称一致
- [ ] description 清晰描述功能
- [ ] allowed-tools 列出所有需要的工具
- [ ] 任务指令步骤清晰
- [ ] 明确指定使用的工具
- [ ] 提供示例输出
- [ ] 包含友好的提示信息

### 本地测试

- [ ] 运行 `npm test` 测试安装脚本
- [ ] 运行 `npm run install:local` 项目级安装
- [ ] 验证 SKILL.md 已正确复制
- [ ] 在 Claude Code 中测试技能功能
- [ ] 检查输出是否符合预期

### 代码提交

- [ ] 代码已通过测试
- [ ] 提交信息遵循规范
- [ ] 文档已同步更新

---

## 🔍 常见问题

### Q1: 技能名称可以包含大写字母吗？

**A**: 不推荐。虽然 npm 允许，但技能名称应使用小写字母和连字符，保持一致性。

### Q2: allowed-tools 必须列出所有工具吗？

**A**: 是的。Claude Code 需要明确知道技能可以访问哪些工具，出于安全考虑。

### Q3: 如何在本地快速测试技能修改？

**A**:

1. 修改 SKILL.md
2. 重新运行 `npm run install:local`
3. 在 Claude Code 中测试

### Q4: 安装脚本失败怎么办？

**A**:

1. 检查 Node.js 版本（>= 18.0.0）
2. 运行 `npm test` 查看将要执行的命令
3. 手动运行 `skills add` 命令查看详细错误信息
4. 检查 `SKILL.md` 格式是否正确

### Q5: 如何调试任务指令？

**A**:

1. 在 Claude Code 中观察执行过程
2. 添加更多的日志输出（使用 `echo` 或在文本中输出）
3. 逐步简化任务指令，定位问题
4. 查看 [06-troubleshooting.md](./06-troubleshooting.md)

---

## 📚 相关文档

- [01-project-structure.md](./01-project-structure.md) - 项目结构规范
- [03-testing-guide.md](./03-testing-guide.md) - 测试流程规范
- [05-skills-reference.md](./05-skills-reference.md) - 技能编写参考

---

## 🎯 下一步

完成开发流程后：

1. **阅读测试流程**: [03-testing-guide.md](./03-testing-guide.md)
2. **了解发布流程**: [04-publishing-workflow.md](./04-publishing-workflow.md)
3. **查看参考文档**: [05-skills-reference.md](./05-skills-reference.md)

---

**开始开发**: 从 [开发模板](../../ref/agent-skill-npm-boilerplate@<your-org>/) 开始创建你的技能
