# 技能示例项目

本文档提供了 Claude Code 技能的实际示例，帮助你快速理解和应用开发规范。

---

## 📚 示例列表

### 1. 简单技能示例：hello-world

**路径**: [`../../skills/hello-world/`](../../skills/hello-world/)

**简介**: 最简单的 Claude Code 技能，用于验证技能系统是否正常工作。

**特点**:
- ✅ 最小化项目结构
- ✅ 单一用途（环境检查）
- ✅ 使用基础工具（Bash）
- ✅ 线性任务流程
- ✅ 适合新手学习

**学习要点**:
1. **项目结构**: 最小化的文件组织
2. **YAML Frontmatter**: 基本字段配置
3. **任务指令**: 简单的顺序执行流程
4. **工具使用**: 仅使用 Bash 工具
5. **安装脚本**: 标准的安装/卸载流程

**适用场景**:
- 第一次创建技能
- 简单的工具类技能
- 环境检查和验证
- 学习基础知识

**访问方式**:
```bash
# 查看项目
cd skills/hello-world

# 安装测试
npm run install:local

# 查看文档
cat README.md
```

---

### 2. 复杂技能示例：handover

**路径**: [`../../skills/handover/`](../../skills/handover/)

**简介**: 跨会话工作交接工具，支持归档和恢复两种模式。

**特点**:
- ✅ 完整的工程化实践
- ✅ 多模式工作流（导出/恢复）
- ✅ 用户交互和选择
- ✅ 文件读写操作
- ✅ CI/CD 集成测试
- ✅ 适合生产环境

**学习要点**:
1. **条件分支**: 根据用户意图执行不同流程
2. **用户交互**: 使用 `AskUserQuestion` 工具
3. **文件操作**: Read、Write 工具的高级用法
4. **任务管理**: 文件归档和状态管理
5. **CI/CD**: GitHub Actions 自动化测试
6. **版本管理**: 语义化版本和 CHANGELOG

**适用场景**:
- 需要用户交互的技能
- 多模式工作流
- 文件操作和状态管理
- 生产级技能开发

**访问方式**:
```bash
# 查看项目
cd skills/handover

# 安装测试
npm run install:local

# 查看文档
cat README.md

# 查看 CI/CD 配置
cat .github/workflows/ci.yml
```

---

## 🎯 如何选择示例

### 选择 hello-world（简单示例）的情况

- ✅ 第一次创建技能
- ✅ 功能简单，单一用途
- ✅ 不需要用户交互
- ✅ 线性任务流程
- ✅ 快速验证想法

### 选择 handover（复杂示例）的情况

- ✅ 需要用户交互
- ✅ 多种工作模式
- ✅ 复杂的文件操作
- ✅ 需要状态管理
- ✅ 生产环境部署

---

## 📖 学习路径

### 初学者路径

1. **阅读规范**
   - [01-project-structure.md](../01-project-structure.md) - 了解项目结构
   - [02-development-workflow.md](../02-development-workflow.md) - 了解开发流程

2. **研究简单示例**
   - 查看 `skills/hello-world/package.json` - 了解基本配置
   - 查看 `skills/hello-world/SKILL.md` - 了解任务指令编写
   - 查看 `skills/hello-world/scripts/install-skill.js` - 了解安装脚本

3. **实践创建**
   - 使用开发模板 `ref/agent-skill-npm-boilerplate@catcuts/`
   - 创建你自己的简单技能
   - 本地测试验证

4. **发布技能**
   - 阅读 [04-publishing-workflow.md](../04-publishing-workflow.md)
   - 发布到 npm

### 进阶路径

1. **掌握基础**
   - 完成初学者路径
   - 创建并发布至少一个简单技能

2. **研究复杂示例**
   - 查看 `skills/handover/SKILL.md` - 了解多模式工作流
   - 查看 `skills/handover/.github/workflows/ci.yml` - 了解 CI/CD
   - 查看 `skills/handover/scripts/install-skill.js` - 了解命令行参数处理

3. **深入学习**
   - [05-skills-reference.md](../05-skills-reference.md) - 高级编写技巧
   - [03-testing-guide.md](../03-testing-guide.md) - 完整测试流程

4. **创建复杂技能**
   - 设计多模式工作流
   - 实现用户交互
   - 配置 CI/CD

---

## 🔍 示例对比

| 特性 | hello-world | handover |
|------|-------------|----------|
| **复杂度** | 简单 | 复杂 |
| **文件数量** | 7 | 8 (+ CI/CD) |
| **allowed-tools** | Bash | Bash, Read, Write |
| **任务流程** | 线性 | 条件分支 |
| **用户交互** | 无 | 有 |
| **文件操作** | 只读 | 读写 |
| **CI/CD** | 无 | 有 |
| **适用场景** | 学习、验证 | 生产环境 |
| **代码行数** | ~100 | ~200 (+ CI/CD) |

---

## 💡 实践建议

### 从简单开始

1. **第一个技能**: 参考 `hello-world`，创建一个简单的工具
2. **逐步增加**: 随着经验积累，逐步增加功能
3. **学习高级**: 需要时再研究 `handover` 的高级特性

### 理解后再复制

- ✅ 先理解为什么这样设计
- ✅ 再复制相关代码
- ❌ 不要盲目复制粘贴

### 遵循规范

- ✅ 严格按照开发规范执行
- ✅ 使用开发模板作为起点
- ✅ 保持代码风格一致

---

## 📝 练习建议

### 练习一：创建环境检查技能

**目标**: 创建一个检查开发环境的技能

**要求**:
- 检查 Node.js、npm、git 版本
- 检查项目依赖是否安装
- 输出友好的检查报告

**参考**: `hello-world`

### 练习二：创建代码生成器

**目标**: 创建一个生成代码模板的技能

**要求**:
- 支持多种模板选择
- 用户交互选择模板类型
- 生成文件到指定位置

**参考**: `handover` 的用户交互部分

### 练习三：创建项目管理工具

**目标**: 创建一个管理开发任务的技能

**要求**:
- 支持创建、列出、完成任务
- 使用 TodoWrite 工具
- 持久化任务状态

**参考**: `handover` 的文件操作部分

---

## 🆘 获取帮助

- **开发问题**: 查看 [06-troubleshooting.md](../06-trtroubleshooting.md)
- **编写参考**: 查看 [05-skills-reference.md](../05-skills-reference.md)
- **GitHub Issues**: [提交问题](https://github.com/catcuts/agent-skills/issues)

---

## 🎓 推荐阅读顺序

1. ✅ 本文档（示例索引）
2. ✅ `skills/hello-world/` 项目
3. ✅ [02-development-workflow.md](../02-development-workflow.md)
4. ✅ `skills/handover/` 项目
5. ✅ [05-skills-reference.md](../05-skills-reference.md)

---

**开始学习**: 从 [hello-world](../../skills/hello-world/) 开始你的第一个技能！
