#!/usr/bin/env node

/**
 * Hello World Skill 安装脚本
 * 使用 skills 将 skill 安装到 Claude Code
 *
 * 命令行参数 (推荐):
 * --dry-run: 测试模式,只显示将要执行的命令,不实际安装
 * --global: 强制全局安装
 * --local: 强制项目级安装
 *
 * 环境变量 (备用):
 * - SKILL_SCOPE: 安装范围,可选值: GLOBAL(全局) 或 LOCAL(项目级),默认: GLOBAL
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { printUsageGuide } = require('./usage-guide');

// 获取包根目录
const packageRoot = path.resolve(__dirname, '..');

// 获取用户主目录
const homeDir = os.homedir();

// 技能名称
const skillName = 'hello-world';

// 需要清理的路径列表
const pathsToClean = {
    // skills CLI 的规范副本目录（这是问题的根源）
    canonical: path.join(homeDir, '.agents', 'skills', skillName),

    // Claude Code 全局技能目录（符号链接）
    claudeGlobal: path.join(homeDir, '.claude', 'skills', skillName),

    // Claude Code 项目级技能目录（如果存在）
    claudeLocal: path.join(process.cwd(), '.claude', 'skills', skillName),
};

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

// 日志函数
function log(message, type = 'info') {
    const prefix =
        {
            info: '✓',
            success: '✓',
            warning: '⚠',
            error: '✗',
        }[type] || '✓';

    console.log(`${prefix} ${message}`);
}

// 检查路径是否为符号链接
function isSymlink(filePath) {
    try {
        return fs.lstatSync(filePath).isSymbolicLink();
    } catch (e) {
        return false;
    }
}

// 安全删除路径（支持符号链接、文件、目录）
function safeRemovePath(filePath, description) {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: true, removed: false, message: `不存在：${description}(${filePath})` };
        }

        const stats = fs.lstatSync(filePath);
        const isLink = stats.isSymbolicLink();
        const isDir = stats.isDirectory();

        if (isLink) {
            fs.unlinkSync(filePath);
            return {
                success: true,
                removed: true,
                message: `已删除符号链接: ${description}(${filePath})`
            };
        } else if (isDir) {
            fs.rmSync(filePath, { recursive: true, force: true });
            return {
                success: true,
                removed: true,
                message: `已删除目录: ${description}(${filePath})`
            };
        } else {
            fs.unlinkSync(filePath);
            return {
                success: true,
                removed: true,
                message: `已删除文件: ${description}(${filePath})`
            };
        }
    } catch (error) {
        return {
            success: false,
            removed: false,
            message: `删除失败: ${description}(${filePath}) - ${error.message}`
        };
    }
}

// 清理旧的安装文件
function cleanOldInstallations() {
    log('\n正在清理旧的安装文件...', 'info');

    const results = [];

    // 1. 清理规范副本目录（.agents/skills/hello-world）
    const canonicalResult = safeRemovePath(
        pathsToClean.canonical,
        '规范副本'
    );
    results.push({ path: pathsToClean.canonical, ...canonicalResult });

    // 2. 清理 Claude Code 全局符号链接
    const globalResult = safeRemovePath(
        pathsToClean.claudeGlobal,
        '全局技能链接'
    );
    results.push({ path: pathsToClean.claudeGlobal, ...globalResult });

    // 3. 清理 Claude Code 项目级安装（如果存在）
    const localResult = safeRemovePath(
        pathsToClean.claudeLocal,
        '项目级技能'
    );
    results.push({ path: pathsToClean.claudeLocal, ...localResult });

    // 输出清理结果
    let removedCount = 0;
    results.forEach((result) => {
        if (result.removed) {
            log(`  ✓ ${result.message}`, 'success');
            removedCount++;
        } else if (result.success) {
            log(`  ⊗ ${result.message} (跳过)`, 'info');
        } else {
            log(`  ✗ ${result.message}`, 'warning');
        }
    });

    if (removedCount > 0) {
        log(`\n已清理 ${removedCount} 个旧安装文件`, 'success');
    } else {
        log('未发现需要清理的文件', 'info');
    }

    return removedCount > 0;
}

// 错误处理
function handleError(error) {
    log(`安装失败: ${error.message}`, 'error');
    log('\n您可以尝试手动安装:', 'warning');
    log(`  npx skills add "${packageRoot}" ${isGlobal ? '-g' : ''} -y`);
    process.exit(1);
}

try {
    log(`开始安装 Hello World Skill...`, 'info');
    log(`安装范围: ${isGlobal ? '全局(GLOBAL)' : '项目级(LOCAL)'}`, 'info');

    // 清理旧的安装文件（解决增量更新导致的文件残留问题）
    cleanOldInstallations();

    // 构建 skills 命令
    const commandParts = [
        'npx',
        '-y',  // 自动确认 npx 安装
        'skills',  // 始终使用最新版本
        'add',
        `"${packageRoot}"`,
    ];

    if (isGlobal) {
        commandParts.push('-g');
    }

    commandParts.push('-y'); // 非交互模式

    const command = commandParts.join(' ');

    if (dryRun) {
        log('\n[DRY-RUN] 将要执行的命令:', 'warning');
        console.log(`  ${command}`);
        log(
            '\n测试通过 - 实际安装请运行: npm run install:global 或 npm run install:local',
            'success'
        );
        process.exit(0);
    }

    // 执行安装
    log('\n正在执行 skills add...', 'info');
    execSync(command, {
        stdio: 'inherit',
        cwd: packageRoot,
    });

    log('\n安装成功!', 'success');
    log(
        `Skill 已安装到: ${isGlobal ? '~/.claude/skills/hello-world' : '.claude/skills/hello-world'}`,
        'info'
    );

    // 显示使用指南
    printUsageGuide();
} catch (error) {
    handleError(error);
}
