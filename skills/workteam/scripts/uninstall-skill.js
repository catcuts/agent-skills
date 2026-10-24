#!/usr/bin/env node

/** Workteam Skill 卸载脚本：移除用户级技能目录副本 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const skillName = 'workteam';
const dryRun = process.argv.includes('--dry-run');

const targets = [
    path.join(os.homedir(), '.agents', 'skills', skillName),
    path.join(os.homedir(), '.claude', 'skills', skillName),
];

for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    if (dryRun) {
        console.log(`[dry-run] 将删除 ${target}`);
        continue;
    }
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`已移除 ${target}`);
}

if (!dryRun) console.log('workteam 技能卸载完成。');
