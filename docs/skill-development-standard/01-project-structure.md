# 项目结构规范

本文档定义了 Claude Code 技能的标准项目结构，确保所有技能具有一致的组织方式。

---

## 📁 标准目录结构

### 最小化结构（基础技能）

```
my-skill/
├── package.json              # NPM 包配置（必需）
├── SKILL.md                  # 技能定义文件（必需）
├── README.md                 # 使用文档（必需）
├── LICENSE                   # 许可证文件（推荐）
└── scripts/
    ├── install-skill.js      # 安装脚本（必需）
    ├── uninstall-skill.js    # 卸载脚本（必需）
    └── usage-guide.js        # 使用指南生成器（推荐）
```

### 完整结构（工程化技能）

```
my-skill/
├── package.json              # NPM 包配置
├── SKILL.md                  # 技能定义文件
├── README.md                 # 使用文档
├── LICENSE                   # MIT 许可证
├── .gitignore                # Git 忽略规则
├── .github/
│   └── workflows/
│       └── ci.yml            # CI/CD 配置（可选）
└── scripts/
    ├── install-skill.js      # 安装脚本
    ├── uninstall-skill.js    # 卸载脚本
    └── usage-guide.js        # 使用指南生成器（推荐）
```

**说明**：

- **最小化结构**：适合简单技能，无复杂依赖
- **完整结构**：适合需要 CI/CD 测试的技能

---

## 📄 文件详解

### 1. package.json

NPM 包的核心配置文件，定义包的元数据和依赖关系。

#### 必需字段

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
    "keywords": ["claude-code", "skill"],
    "author": "your-name",
    "license": "MIT",
    "engines": {
        "node": ">=18.0.0"
    }
}
```

#### 字段说明

| 字段          | 说明                     | 示例                       | 必需 |
| ------------- | ------------------------ | -------------------------- | ---- |
| `name`        | 包名，使用 npm scope     | `@<your-org>/my-skill`      | ✅   |
| `version`     | 当前版本号（语义化版本） | `1.0.0`                    | ✅   |
| `description` | 包的简短描述             | `"跨会话工作交接工具"`     | ✅   |
| `main`        | 入口文件（兼容性）       | `"index.js"`               | ✅   |
| `scripts`     | NPM 脚本命令             | 见下文                     | ✅   |
| `files`       | 发布到 npm 的文件列表    | `["SKILL.md", "scripts/"]` | ✅   |
| `keywords`    | 搜索关键词               | `["claude-code", "skill"]` | ✅   |
| `author`      | 作者信息                 | `"<your-name>"`           | ✅   |
| `license`     | 许可证                   | `"MIT"`                    | ✅   |
| `repository`  | 仓库地址                 | 见下文                     | 推荐 |
| `bugs`        | 问题追踪地址             | 见下文                     | 推荐 |
| `homepage`    | 项目主页                 | 见下文                     | 推荐 |
| `engines`     | Node.js 版本要求         | `{"node": ">=18.0.0"}`     | 推荐 |

#### repository 字段（推荐）

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/<your-username>/<your-repo>.git",
  "directory": "skills/my-skill"
}
```

#### scripts 字段详解

```json
"scripts": {
  "postinstall": "node scripts/install-skill.js",      // npm install 后自动执行
  "preuninstall": "node scripts/uninstall-skill.js",  // npm uninstall 前自动执行
  "test": "node scripts/install-skill.js --dry-run",  // 测试安装配置
  "install:global": "node scripts/install-skill.js --global",  // 手动全局安装
  "install:local": "node scripts/install-skill.js --local"     // 手动项目级安装
}
```

**说明**：

- `postinstall` / `preuninstall`：npm 钩子，自动执行安装/卸载脚本
- `test`：测试模式（`--dry-run`），不实际安装
- `install:global` / `install:local`：手动安装命令

#### files 字段详解

```json
"files": [
  "SKILL.md",       // 技能定义文件（必需）
  "scripts/"        // 安装/卸载脚本（必需）
  // 注意：不需要包含 README.md、LICENSE 等
]
```

**说明**：

- 只包含运行时必需的文件
- 减小 npm 包体积
- README 和 LICENSE 会自动包含

---

### 2. SKILL.md

技能定义文件，包含 YAML frontmatter 和任务指令。

#### YAML Frontmatter（必需）

```yaml
---
name: my-skill
description: 技能功能描述，一句话说明技能的作用
allowed-tools: Bash, Read, Write
version: 1.0.0
---
```

#### 字段说明

| 字段            | 说明                     | 示例                            | 必需 |
| --------------- | ------------------------ | ------------------------------- | ---- |
| `name`          | 技能名称（小写，连字符） | `hello-world`                   | ✅   |
| `description`   | 技能功能描述             | `"简单的 Hello World 示例技能"` | ✅   |
| `allowed-tools` | 允许使用的工具列表       | `Bash, Read, Write`             | ✅   |
| `version`       | 技能版本号               | `1.0.0`                         | 推荐 |

#### 任务指令示例

```markdown
# My Skill

## 任务指令

当被调用时，执行以下步骤：

1. **步骤一**
    - 使用 `Bash` 工具执行命令
    - 显示结果

2. **步骤二**
    - 使用 `Read` 工具读取文件
    - 分析内容

3. **输出结果**
```

✓ 任务完成

```

```

**编写要点**：

- 步骤清晰，编号列表
- 明确指定使用的工具
- 提供示例输出
- 使用友好的提示信息

---

### 3. scripts/install-skill.js

安装脚本，使用 `skills` 工具将 SKILL.md 安装到 Claude Code。

#### 核心功能

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// 获取包根目录
const packageRoot = path.resolve(__dirname, '..');

// 解析命令行参数
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const forceGlobal = args.includes('--global');
const forceLocal = args.includes('--local');

// 确定安装范围
let scope;
if (forceGlobal) {
    scope = 'GLOBAL';
} else if (forceLocal) {
    scope = 'LOCAL';
} else {
    scope = (process.env.SKILL_SCOPE || 'GLOBAL').toUpperCase();
}

const isGlobal = scope === 'GLOBAL';

// 构建 skills 命令
const commandParts = [
    'npx',
    '-y',  // 自动确认 npx 安装
    'skills',  // 始终使用最新版本
    'add',
    `"${packageRoot}"`
];

if (isGlobal) {
    commandParts.push('-g');
}

commandParts.push('-y'); // 非交互模式

const command = commandParts.join(' ');

// 执行安装
if (!dryRun) {
    execSync(command, { stdio: 'inherit', cwd: packageRoot });
    console.log('✓ 安装成功!');
}
```

#### 命令行参数

| 参数        | 说明                 | 示例                     |
| ----------- | -------------------- | ------------------------ |
| `--dry-run` | 测试模式，不实际安装 | `npm test`               |
| `--global`  | 强制全局安装         | `npm run install:global` |
| `--local`   | 强制项目级安装       | `npm run install:local`  |

#### 环境变量

| 变量          | 说明                        | 默认值   |
| ------------- | --------------------------- | -------- |
| `SKILL_SCOPE` | 安装范围（GLOBAL 或 LOCAL） | `GLOBAL` |

---

### 4. scripts/uninstall-skill.js

卸载脚本，删除已安装的技能文件。

#### 核心功能

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const packageRoot = path.resolve(__dirname, '..');
const skillName = require('../package.json').name.split('/')[1];

// 确定删除路径
const globalDir = path.join(os.homedir(), '.claude', 'skills', skillName);
const localDir = path.join(process.cwd(), '.claude', 'skills', skillName);

// 删除函数
function removeSkill(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✓ 已删除: ${dir}`);
    }
}

// 执行删除
removeSkill(globalDir);
removeSkill(localDir);
```

---

### 5. scripts/usage-guide.js

使用指南生成器，在安装成功后显示友好的使用提示。

#### 为什么需要 usage-guide.js？

当用户执行 `npm install` 安装技能时，npm 只会显示 `added xxx packages in xxx s`，用户不知道如何使用已安装的技能。`usage-guide.js` 在安装成功后自动显示：
- 技能名称和功能描述
- 如何触发/调用该技能
- 更多信息的链接

#### 核心功能

```javascript
#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

/**
 * 读取 package.json 中的信息
 */
function getPackageInfo() {
    const packageRoot = path.resolve(__dirname, '..');
    const packageJsonPath = path.join(packageRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    return {
        name: packageJson.name.split('/')[1] || packageJson.name,
        description: packageJson.description,
        homepage: packageJson.homepage || '',
        repository: packageJson.repository?.url || '',
    };
}

/**
 * 读取 SKILL.md 中的触发指令
 */
function getSkillInstructions() {
    const packageRoot = path.resolve(__dirname, '..');
    const skillMdPath = path.join(packageRoot, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
        return null;
    }

    const content = fs.readFileSync(skillMdPath, 'utf-8');
    // 匹配 description 行中的指令说明
    const match = content.match(/^description:\s*(.+)$/m);
    return match ? match[1].trim() : null;
}

/**
 * 打印使用指南
 */
function printUsageGuide() {
    const pkg = getPackageInfo();
    const instructions = getSkillInstructions();

    // 如果 SKILL.md 中有指令说明，使用它；否则使用 package.json 的 description
    const usageInfo = instructions || pkg.description;

    const guide = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎉 技能安装成功！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 技能名称:    ${pkg.name}
📝 功能描述:    ${pkg.description}

🚀 如何使用:
   ${usageInfo}

📖 更多信息:
   ${pkg.homepage ? `   文档: ${pkg.homepage}` : ''}
   ${pkg.repository ? `   仓库: ${pkg.repository}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    console.log(guide);
}

module.exports = { printUsageGuide };
```

#### 在 install-skill.js 中调用

在安装脚本的成功位置调用使用指南：

```javascript
const { printUsageGuide } = require('./usage-guide');

// ... 安装逻辑 ...

log('\n安装成功!', 'success');

// 显示使用指南
printUsageGuide();
```

#### 安装后输出效果

```
✓ 安装成功!
✓ Skill 已安装到: ~/.claude/skills/my-skill

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎉 技能安装成功！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 技能名称:    my-skill
📝 功能描述:    技能功能描述

🚀 如何使用:
   在 Claude Code 中说"帮我做 xxx"或"执行 xxx"

📖 更多信息:
   文档: https://github.com/username/repo#readme
   仓库: git+https://github.com/username/repo.git

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 最佳实践

- **自动化信息提取**: 从 `package.json` 和 `SKILL.md` 自动读取信息，避免硬编码
- **友好的格式**: 使用符号（🎉、📦、🚀）和分隔线让输出更醒目
- **清晰的使用说明**: 明确告诉用户如何触发技能
- **提供更多信息**: 包含文档和仓库链接，方便深入了解

---

### 6. README.md

使用文档，向用户说明技能的功能、安装和使用方法。

#### 推荐结构

```markdown
# My Skill

技能功能简述。

## 项目简介

详细说明技能的功能和适用场景。

## 功能特性

- **特性一**：说明
- **特性二**：说明

## 安装方法

### 快速安装

\`\`\`bash
npm install -g @<your-org>/my-skill
\`\`\`

## 使用示例

安装完成后，在 Claude Code 中输入：

\`\`\`
my-skill
\`\`\`

## 技术细节

（可选）实现原理、技术栈说明

## 系统要求

- Node.js >= 18.0.0
- Claude Code CLI

## 许可证

MIT License
```

---

## 📦 必需文件清单

### 运行时必需（必须包含在 package.json 的 files 字段中）

- [x] `SKILL.md` - 技能定义文件
- [x] `scripts/install-skill.js` - 安装脚本
- [x] `scripts/uninstall-skill.js` - 卸载脚本
- [x] `scripts/usage-guide.js` - 使用指南生成器（推荐）

### 发布时推荐（npm 自动包含）

- [x] `package.json` - 包配置
- [x] `README.md` - 使用文档
- [x] `LICENSE` - 许可证文件

### 开发时推荐（不发布到 npm）

- [x] `.gitignore` - Git 忽略规则
- [x] `.github/workflows/ci.yml` - CI/CD 配置（可选）

---

## 🎯 文件命名规范

### 技能名称

- **格式**: 小写字母、数字、连字符
- **示例**: `hello-world`, `code-generator`, `api-helper`
- **避免**: 大写字母、下划线、特殊字符

### 包名（npm package name）

- **格式**: `@scope/skill-name`
- **scope**: 使用你的 npm 用户名或组织名
- **示例**: `@<your-org>/hello-world`

### 文件名

- **脚本文件**: 小写，连字符分隔（如 `install-skill.js`）
- **配置文件**: 点开头（如 `.gitignore`）
- **文档文件**: 大写（如 `README.md`, `LICENSE`）

---

## 📂 安装路径

### 全局安装

```
实际存储: ~/.agents/skills/{skill-name}/
Claude 链接: ~/.claude/skills/{skill-name}/ (符号链接)
```

### 项目级安装

```
实际存储: .agents/skills/{skill-name}/
Claude 链接: .claude/skills/{skill-name}/ (符号链接)
```

**说明**：

- `skills` 会创建符号链接
- 删除符号链接不影响实际文件
- 卸载 npm 包时会自动清理

---

## ✅ 检查清单

创建新技能时，确保以下文件和配置齐全：

### 基础检查

- [ ] `package.json` 包含所有必需字段
- [ ] `SKILL.md` 包含有效的 YAML frontmatter
- [ ] `scripts/install-skill.js` 支持 `--dry-run` 参数
- [ ] `scripts/install-skill.js` 在安装成功后调用 `printUsageGuide()`
- [ ] `scripts/usage-guide.js` 自动提取信息并生成使用指南
- [ ] `scripts/uninstall-skill.js` 正确删除文件
- [ ] `README.md` 提供清晰的使用说明

### 配置检查

- [ ] `name` 使用 npm scope 格式（`@username/skill-name`）
- [ ] `version` 遵循语义化版本规范
- [ ] `files` 字段只包含必需文件
- [ ] `engines` 指定 Node.js 版本要求

### 文档检查

- [ ] README.md 包含安装说明
- [ ] README.md 包含使用示例
- [ ] SKILL.md 任务指令清晰易懂
- [ ] 所有文件包含适当的注释

---

## 🔍 常见问题

### Q1: 为什么需要 scripts 目录？

**A**: 将脚本集中管理，保持项目根目录整洁。`scripts/` 目录也是 Node.js 项目的常见约定。

### Q2: files 字段不包含 README.md 和 LICENSE？

**A**: npm 会自动包含 README.md、LICENSE 和 package.json，不需要在 `files` 字段中指定。

### Q3: 如何在本地测试安装脚本？

**A**: 使用 `--dry-run` 参数：

```bash
npm test
# 或
node scripts/install-skill.js --dry-run
```

### Q4: 全局安装和项目级安装有什么区别？

**A**:

- **全局**: 所有项目都可用，安装到 `~/.claude/skills/`
- **项目级**: 仅当前项目可用，安装到 `.claude/skills/`

---

## 📚 相关文档

- [02-development-workflow.md](./02-development-workflow.md) - 开发流程规范
- [05-skills-reference.md](./05-skills-reference.md) - 技能编写参考
- [开发模板](../../ref/agent-skill-npm-boilerplate@<your-org>/) - 完整的项目模板

---

**下一步**: 阅读 [02-development-workflow.md](./02-development-workflow.md) 了解开发流程
