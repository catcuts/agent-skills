#!/usr/bin/env node

/**
 * Workteam Skill 安装脚本（纯文档型技能：整目录复制到技能目录）
 *
 * 参数：
 *   --dry-run: 只打印目标动作，不实际复制
 *   --global / --local: 兼容仓库其他技能的参数习惯（本技能无差别，均装到用户级）
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const packageRoot = path.resolve(__dirname, '..');
const skillName = 'workteam';
const dryRun = process.argv.includes('--dry-run');

const targets = [
    path.join(os.homedir(), '.agents', 'skills', skillName),
    path.join(os.homedir(), '.claude', 'skills', skillName),
];

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'scripts') continue;
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}

for (const target of targets) {
    if (dryRun) {
        console.log(`[dry-run] 将复制 ${packageRoot} -> ${target}`);
        continue;
    }
    copyDir(packageRoot, target);
    console.log(`已安装到 ${target}`);
}

if (!dryRun) console.log('workteam 技能安装完成（SKILL.md + references + assets）。');
