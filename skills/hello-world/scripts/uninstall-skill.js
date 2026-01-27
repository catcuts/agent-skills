#!/usr/bin/env node

/**
 * Hello World Skill 卸载脚本
 * 从 Claude Code 中移除 skill
 *
 * 命令行参数 (推荐):
 * --global: 强制全局卸载
 * --local: 强制项目级卸载
 *
 * 环境变量 (备用):
 * - SKILL_SCOPE: 安装范围,可选值: GLOBAL(全局) 或 LOCAL(项目级),默认: GLOBAL
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// 技能名称
const skillName = 'hello-world';

// 解析命令行参数
const args = process.argv.slice(2);
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

// 安全删除路径（支持符号链接、文件、目录）
function safeRemovePath(filePath, description) {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: true, removed: false, message: `已不存在：${description}(${filePath})` };
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
        // 忽略"文件不存在"错误，可能已被并发删除
        if (error.code === 'ENOENT') {
            return { success: true, removed: false, message: `已不存在：${description}(${filePath})` };
        }
        return {
            success: false,
            removed: false,
            message: `删除失败: ${description}(${filePath}) - ${error.message}`
        };
    }
}

try {
    log(`开始卸载 Hello World Skill...`, 'info');
    log(`卸载范围: ${isGlobal ? '全局(GLOBAL)' : '项目级(LOCAL)'}`, 'info');

    log('\n正在清理技能文件...', 'info');

    const results = [];

    if (isGlobal) {
        // 全局卸载
        const homeDir = os.homedir();

        // 1. 清理规范副本目录（.agents/skills/hello-world）
        const canonicalResult = safeRemovePath(
            path.join(homeDir, '.agents', 'skills', skillName),
            '规范副本'
        );
        results.push(canonicalResult);

        // 2. 清理 Claude Code 全局符号链接
        const globalResult = safeRemovePath(
            path.join(homeDir, '.claude', 'skills', skillName),
            '全局技能链接'
        );
        results.push(globalResult);
    } else {
        // 项目级卸载
        const cwd = process.cwd();

        // 1. 清理项目级规范副本（如果存在）
        const canonicalResult = safeRemovePath(
            path.join(cwd, '.agents', 'skills', skillName),
            '项目级规范副本'
        );
        results.push(canonicalResult);

        // 2. 清理 Claude Code 项目级技能
        const localResult = safeRemovePath(
            path.join(cwd, '.claude', 'skills', skillName),
            '项目级技能'
        );
        results.push(localResult);
    }

    // 输出清理结果
    let removedCount = 0;
    let errorCount = 0;

    results.forEach((result) => {
        if (result.removed) {
            log(`  ✓ ${result.message}`, 'success');
            removedCount++;
        } else if (result.success) {
            log(`  ⊗ ${result.message} (跳过)`, 'info');
        } else {
            log(`  ✗ ${result.message}`, 'error');
            errorCount++;
        }
    });

    // 总结
    if (removedCount > 0) {
        log(`\n✓ 卸载成功! 已删除 ${removedCount} 个文件/目录`, 'success');
    } else if (errorCount === 0) {
        log('\n⊗ 未找到需要卸载的文件', 'warning');
    }

    if (errorCount > 0) {
        log(`\n⚠ 有 ${errorCount} 个项目删除失败，请手动清理`, 'warning');
        process.exit(1);
    }
} catch (error) {
    log(`卸载失败: ${error.message}`, 'error');
    process.exit(1);
}
