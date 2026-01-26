#!/usr/bin/env node

/**
 * Handover Skill 卸载脚本
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

// 递归删除目录
function removeDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return false;
    }

    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        return true;
    } catch (error) {
        log(`删除 ${dirPath} 失败: ${error.message}`, 'error');
        return false;
    }
}

try {
    log(`开始卸载 Handover Skill...`, 'info');
    log(`卸载范围: ${isGlobal ? '全局(GLOBAL)' : '项目级(LOCAL)'}`, 'info');

    let removedCount = 0;

    if (isGlobal) {
        // 全局卸载
        const homeDir = os.homedir();
        const paths = [
            path.join(homeDir, '.claude', 'skills', 'handover'),
            path.join(homeDir, '.agents', 'skills', 'handover'),
        ];

        paths.forEach((dirPath) => {
            if (removeDirectory(dirPath)) {
                log(`已删除: ${dirPath}`, 'success');
                removedCount++;
            }
        });
    } else {
        // 项目级卸载
        const cwd = process.cwd();
        const paths = [
            path.join(cwd, '.claude', 'skills', 'handover'),
            path.join(cwd, '.agents', 'skills', 'handover'),
        ];

        paths.forEach((dirPath) => {
            if (removeDirectory(dirPath)) {
                log(`已删除: ${dirPath}`, 'success');
                removedCount++;
            }
        });
    }

    if (removedCount > 0) {
        log(`\n卸载成功! 已删除 ${removedCount} 个目录`, 'success');
    } else {
        log('\n未找到已安装的 skill 文件', 'warning');
    }
} catch (error) {
    log(`卸载失败: ${error.message}`, 'error');
    process.exit(1);
}
